const fs = require('fs');
const Koa = require('koa');
const path = require('path');
const send = require('koa-send');
const LRU = require('lru-cache');
const Router = require('@koa/router');
const devMiddleware = require('./lib/devMiddleware');

// SSR 相关
// server bundle 创建的 renderer 会自动将带有 hash 值文件名的js文件引入到 template 中
const { createBundleRenderer } = require('vue-server-renderer');
const serverBundle = require('./dist/vue-ssr-server-bundle.json');
const clientManifest = require('./dist/vue-ssr-client-manifest.json');
const template = fs.readFileSync('./src/template/index.html', 'utf8');
const renderer = createBundleRenderer(serverBundle, {
  runInNewContext: false,
  clientManifest,
  template,
});

// Server 相关
const server = new Koa();
const router = new Router();
const distRouter = new Router({
  prefix: '/dist'
});

// 目前 app 都应是非用户特定的，所以直接使用 micro-cache
const isCacheable = req => true;
const microCache = new LRU({
  max: 300,
  maxAge: 1000,
  stale: true //允许过期内容，减少请求峰值
});

// 浏览器最大缓存时间视情况更改
const maxage = process.env.NODE_ENV === 'production' ? 1000 * 60 : 0;
distRouter.get('*', async ctx => {
  const filename = ctx.path.split(/\/dist(?:\/)?/)[1];
  if (!filename) return ctx.throw(404);

  // koa-send 文档示例有 send(ctx, ctx.path, { root: __dirname + '/public' })
  // 经过测试 ctx.path 应指请求访问的文件名
  try {
    await send(ctx, filename, { root: path.resolve(__dirname, './dist'), maxage });
  } catch (e) {
    ctx.throw();
  }
});

router.get('/manifest.json', async ctx => {
  try {
    await send(ctx, path.resolve('./manifest.json'), { maxage });
  } catch (e) {
    ctx.throw(e);
  }
});

// Render 相关路由
router.get('*', async (ctx, next) => {
  await next();
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
    const html = await renderer.renderToString(context);

    if (cacheable) microCache.set(ctx.url, html);
    ctx.state.html = html;
  } catch (e) {
    ctx.throw(e.code || 500);
    console.log(e.message);
  }
});

// 更特定 (specific) 路由放在前面
server.use(distRouter.routes());
server.use(distRouter.allowedMethods());

server.use(router.routes());
server.use(router.allowedMethods());

const listen = () => {
  server.listen(8080, () => {
    console.log('Server running at localhost:8080');
  });
};

process.env.NODE_ENV === 'production'
  ? listen()
  : devMiddleware(server).then(listen);
