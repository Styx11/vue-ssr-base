const fs = require('fs');
const Koa = require('koa');
const path = require('path');
const send = require('koa-send');
const LRU = require('lru-cache');
const Router = require('@koa/router');
const devMiddleware = require('./lib/devMiddleware');
const { createBundleRenderer } = require('vue-server-renderer');

// SSR 相关
// server bundle 创建的 renderer 会自动将带有 hash 值文件名的js文件引入到 template 中
let renderer;
const isProd = process.env.NODE_ENV === 'production';
let template = fs.readFileSync('./src/template/index.html', 'utf8');
if (isProd) {
  const serverBundle = require('./dist/vue-ssr-server-bundle.json');
  const clientManifest = require('./dist/vue-ssr-client-manifest.json');
  renderer = createBundleRenderer(serverBundle, {
    runInNewContext: false,
    clientManifest,
    template,
  });
}

// 开发模式下 renderer 相关交由 devMiddleware 编译处理
const render = {
  template,
  renderer,
};

// Server 相关
// 目前 app 都应是非用户特定的，所以直接使用 micro-cache
const isCacheable = req => true;
const microCache = new LRU({
  max: 300,
  maxAge: 1000,
  stale: true //允许过期内容，减少请求峰值
});
const server = new Koa();
const router = new Router();
const distRouter = new Router({
  prefix: '/dist'
});

// 浏览器最大缓存时间视情况更改
const maxage = isProd ? 1000 * 60 : 0;
distRouter.get('*', async ctx => {
  const filename = ctx.path.split(/\/dist(?:\/)?/)[1];
  if (!filename) return ctx.throw(404);

  // koa-send 文档示例有 send(ctx, ctx.path, { root: __dirname + '/public' })
  // 经过测试 ctx.path 应指请求访问的文件名
  try {
    await send(ctx, filename, { root: path.resolve(__dirname, './dist'), maxage });
  } catch (e) {
    ctx.throw(404);
    console.error(e.message);
  }
});

// Render 相关路由
router.get('*', async (ctx, next) => {
  await next();
  ctx.status = 200;
  ctx.body = ctx.state.html;
});

router.get('*', async ctx => {
  const cacheable = isCacheable(ctx);
  if (cacheable) {
    const hit = microCache.get(ctx.url);
    if (hit) {
      return ctx.state.html = hit;
    }
  }

  const context = { title: 'Hello SSR', url: ctx.url };
  try {
    const html = await render.renderer.renderToString(context);

    if (cacheable) microCache.set(ctx.url, html);
    ctx.state.html = html;
  } catch (e) {
    ctx.throw(e.code || 500);
    console.error(e.message);
  }
});

// 更特定 (specific) 路由放在前面
// 开发模式下由 devMiddleware 处理编译文件请求
if (isProd) {
  server.use(distRouter.routes());
  server.use(distRouter.allowedMethods());
}

// 最后挂载通配符 * 路由
// 以让渲染文件请求通过 devMiddleware
const listen = () => {
  server.use(router.routes());
  server.use(router.allowedMethods());
  server.listen(8080, () => {
    console.log('Server running at localhost:8080');
  });
};

isProd
  ? listen()
  : devMiddleware(server, render).then(listen);
