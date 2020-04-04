const path = require('path');
const webpack = require('webpack');
const clientConfig = require('../config/webpack.client');
const serverConfig = require('../config/webpack.server');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

// 为什么返回一组 Promise
// 开发模式下，我们只能在初次编译后才能使用 renderer 并提供服务
// 之后也只能在重新编译获得 renderer 后才能继续提供服务
module.exports = (app, renderer) => {
  let serverResolve, clientResolve;
  const serverPromise = new Promise(res => serverResolve = res);
  const clientPromise = new Promise(res => clientResolve = res);

  // 创建中间件并注册 done hook 获取编译文件
  const devMiddleware = (config, complier, side) => {
    const isClient = side === 'client';
    const middleware = webpackDevMiddleware(complier, {
      publicPath: config.output.publicPath,
      noInfo: true,
    });
    // 编译(compilation)完成钩子
    complier.hooks.done.tap('done', stats => {
      stats = stats.toJson();
      stats.errors.forEach(err => console.error(err));
      stats.warnings.forEach(warning => console.warn(warning));
      if (stats.errors.length) return;

      // 根据 side 选择 serverBundle 或 clientManifest 路径
      // 并使用 devMiddleware 默认的 memory-fs 内存文件系统获取
      const sPath = path.resolve(__dirname, '../dist/vue-ssr-server-bundle.json');
      const cPath = path.resolve(__dirname, '../dist/vue-ssr-client-manifest.json');
      middleware.fileSystem.readFile(isClient ? cPath : sPath, (err, res) => {
        if (err) throw err;

        isClient ? clientResolve() : serverResolve();
      });
    });
    return middleware;
  };

  // client hotMiddleware 相关配置
  // hotMiddleware下不能使用[name].[chunkhash]
  clientConfig.output.filename = '[name].js';
  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  clientConfig.entry = ['webpack-hot-middleware/client', clientConfig.entry.client];

  // clientConfig 中间件
  const clientComplier = webpack(clientConfig);
  const clientDevMiddleware = devMiddleware(clientConfig, clientComplier, 'client');
  const clientHotMiddleware = webpackHotMiddleware(clientComplier, { heartbeat: 2000 });

  // serverConfig 中间件
  // hotMiddleware 对于 server 端是不可用的
  // Server-side bundle should have one single entry file.
  // Avoid using CommonsChunkPlugin in the server config.
  const serverComplier = webpack(serverConfig);
  const serverDevMiddleware = devMiddleware(serverConfig, serverComplier, 'server');

  app.use(clientDevMiddleware);
  app.use(clientHotMiddleware);
  app.use(serverDevMiddleware);

  return Promise.all([serverPromise, clientPromise]);
};
