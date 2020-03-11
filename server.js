const fs = require('fs');
const Koa = require('koa');
const Router = require('@koa/router');

// SSR 相关
const createApp = require('./dist/server.bundle');
const { createRenderer } = require('vue-server-renderer');
const clientManifest = require('./dist/vue-ssr-client-manifest.json');
const template = fs.readFileSync('./src/template/index.html', 'utf8');

// Server 相关
const server = new Koa();
const router = new Router();

const context = {
  title: 'Hello SSR',
};
const app = createApp(context);
const renderer = createRenderer({
  runInNewContext: false,
  clientManifest,
  template
});

// Render 相关路由
router.get('*', async (ctx, next) => {
  await next();
  ctx.body = ctx.state.html;
});

router.get('*', async ctx => {
  try {
    ctx.state.html = await renderer.renderToString(app, context);
  } catch (e) {
    ctx.throw();
    console.log(e.message);
  }
});

server.use(router.routes());
server.use(router.allowedMethods());


server.listen(8080, () => {
  console.log('Server running at localhost:8080');
});
