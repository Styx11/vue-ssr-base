const createRootApp = require('./app');

// 服务端入口需要使用 commonjs 模块

// 因为要将 export default 定义的 es6 模块导出为 commonjs2 模块（就像 vue-ssr 文档演示的）
// webpack v4 会将它赋值给 module 对象的属性（就像下面的 createRootApp.default 那样）
// 但 vue-server-plugin 必须接收一个函数且该函数返回 vue 实例否则会报错
// 所以直接使用 commonjs 模块
module.exports = (context) => {
  const { app } = createRootApp.default();

  return app;
};