const fs = require('fs');
const Koa = require('koa');
const path = require('path');
const send = require('koa-send');
const Router = require('@koa/router');

// SSR 相关
const createApp = require('./dist/server.bundle');
const { createRenderer } = require('vue-server-renderer');
const clientManifest = require('./dist/vue-ssr-client-manifest.json');
const template = fs.readFileSync('./src/template/index.html', 'utf8');
const renderer = createRenderer({
  runInNewContext: false,
  clientManifest,
  template
});

// Server 相关
const server = new Koa();
const router = new Router();
const distRouter = new Router({
  prefix: '/dist'
});

// 之后可以加上特定文件的 micro-cache 策略
distRouter.get('*', async ctx => {
  const filename = ctx.path.split(/\/dist(?:\/)?/)[1];
  if (!filename) return ctx.throw(404);

  // koa-send 文档示例有 send(ctx, ctx.path, { root: __dirname + '/public' })
  // 经过测试 ctx.path 应指请求访问的文件名
  try {
    await send(ctx, filename, { root: path.resolve(__dirname, './dist') });
  } catch (e) {
    ctx.throw();
  }
});

router.get('/manifest.json', async ctx => {
  try {
    await send(ctx, path.resolve('./manifest.json'));
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
  const context = { title: 'Hello SSR' };
  const app = createApp(context);

  try {
    ctx.state.html = await renderer.renderToString(app, context);
  } catch (e) {
    ctx.throw();
    console.log(e.message);
  }
});

// 更特定 (specific) 路由放在前面
server.use(distRouter.routes());
server.use(distRouter.allowedMethods());

server.use(router.routes());
server.use(router.allowedMethods());

server.listen(8080, () => {
  console.log('Server running at localhost:8080');
});
