const path = require('path');
const webpack = require('webpack');
const clientConfig = require('../config/webpack.client');
const serverConfig = require('../config/webpack.server');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const { createBundleRenderer } = require('vue-server-renderer');
const { PassThrough } = require('stream');

// 返回一组 Promise
// 开发模式下，我们只能在初次编译后才能使用 renderer 并提供服务
module.exports = (app, render) => {
  let serverBundle, clientManifest;
  let serverResolve, clientResolve;
  const serverPromise = new Promise(res => serverResolve = res);
  const clientPromise = new Promise(res => clientResolve = res);

  // 创建中间件并注册 done hook 获取编译文件
  const createDevMiddleware = (config, complier, side) => {
    const isClient = side === 'client';
    const middleware = webpackDevMiddleware(complier, {
      publicPath: config.output.publicPath,
      noInfo: true,
    });
    // 编译(compilation)完成钩子
    complier.hooks.done.tap('rebuild-renderer', stats => {
      stats = stats.toJson();
      stats.errors.forEach(err => console.error(err));
      stats.warnings.forEach(warning => console.warn(warning));
      if (stats.errors.length) return;

      // 根据 side 选择 serverBundle 或 clientManifest 路径
      // 并使用 devMiddleware 默认的 memory-fs 内存文件系统获取编译文件
      const sPath = path.resolve(__dirname, '../dist/vue-ssr-server-bundle.json');
      const cPath = path.resolve(__dirname, '../dist/vue-ssr-client-manifest.json');
      middleware.fileSystem.readFile(isClient ? cPath : sPath, (err, res) => {
        if (err) throw err;

        // 重新构建 renderer
        res = JSON.parse(res.toString());
        isClient ? clientManifest = res : serverBundle = res;
        if (clientManifest && serverBundle) {
          render.renderer = createBundleRenderer(serverBundle, {
            template: render.template,
            runInNewContext: false,
            clientManifest,
          });
        }
        isClient ? clientResolve() : serverResolve();
      });
    });
    // 关于 Koa 的中间适配
    // devMiddleware 中间件内部默认使用类 express API
    // breaking changes: commit 23a700ab01be3ff27c93419705ccc4b9c4f90565 v4.0.0-rc.1
    // 适配方法在 devMiddleware 的未来版本或许会改变（目前使用 v3.7.2）
    return async (ctx, next) => {
      await middleware(ctx.req, {
        end: content => {
          ctx.body = content;
        },
        getHeader: ctx.get.bind(ctx),
        setHeader: ctx.set.bind(ctx),
        locals: ctx.state
      }, next);
    }
  };

  // client hotMiddleware 相关配置
  // hotMiddleware下不能使用[name].[chunkhash]
  clientConfig.output.filename = '[name].js';
  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  clientConfig.entry = ['webpack-hot-middleware/client', clientConfig.entry.client];

  // clientConfig 中间件
  const clientComplier = webpack(clientConfig);
  const clientDevMiddleware = createDevMiddleware(clientConfig, clientComplier, 'client');
  const clientHotMiddleware = webpackHotMiddleware(clientComplier, { heartbeat: 5000 });

  // serverConfig 中间件
  // hotMiddleware 对于 server 端是不可用的
  // Server-side bundle should have one single entry file.
  // Avoid using CommonsChunkPlugin in the server config.
  const serverComplier = webpack(serverConfig);
  const serverDevMiddleware = createDevMiddleware(serverConfig, serverComplier, 'server');

  app.use(clientDevMiddleware);
  app.use(serverDevMiddleware);

  // 适配 Koa
  // 因为 hotMiddleware 内部会持续向客户端发送数据，所以设 ctx.body = stream
  // 且必须在方法内设置，否则该请求会导致浏览器下载文件
  app.use(async (ctx, next) => {
    const stream = new PassThrough();
    await clientHotMiddleware(ctx.req, {
      end: stream.end.bind(stream),
      write: content => {
        if (!ctx.body) ctx.body = stream;
        return stream.write(content);
      },
      writeHead: (status, headers) => {
        ctx.status = status;
        ctx.set(headers);
      }
    }, next);
  });

  return Promise.all([serverPromise, clientPromise]);
};
