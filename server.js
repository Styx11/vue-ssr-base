const fs = require('fs');
const Koa = require('koa');
const LRU = require('lru-cache');
const Router = require('@koa/router');
const serve = require('koa-static-server');
const devMiddleware = require('./lib/devMiddleware');
const { createBundleRenderer } = require('vue-server-renderer');

// SSR 相关
// server bundle 创建的 renderer 会自动将带有 hash 值文件名的js文件引入到 template 中
let renderer;
let template = fs.readFileSync('./src/template/index.html', 'utf8');
const isProd = process.env.NODE_ENV === 'production';
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
const app = new Koa();
const router = new Router();
const maxage = isProd ? 1000 * 60 : 0;// 浏览器最大缓存时间
const isCacheable = _ => isProd;
const microCache = new LRU({
  max: 300,
  maxAge: 1000,
  stale: true //允许过期内容，减少请求峰值
});

// 开发模式下由 devMiddleware 提供打包文件
// serve will check if request path is allowed with rootPath
router.use('/dist', serve({ rootDir: './dist', rootPath: '/dist', maxage }));

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
    const html = await render.renderer.renderToString(context);

    if (cacheable) microCache.set(ctx.url, html);
    ctx.state.html = html;
  } catch (e) {
    ctx.throw(e.code || 500);
    console.error(e.message);
  }
});

// 最后挂载通配符 * 路由
// 以让渲染文件请求通过 devMiddleware
const listen = () => {
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(8080, () => {
    console.log('Server running at localhost:8080');
  });
};

isProd
  ? listen()
  : devMiddleware(app, render).then(listen);
