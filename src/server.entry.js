const createRootApp = require('./app');

// 服务端入口需要使用 commonjs 模块

// 因为要将 export default 定义的 es6 模块导出为 commonjs2 模块（就像 vue-ssr 文档演示的）
// webpack v4 会将它赋值给 module 对象的属性（就像下面的 createRootApp.default 那样）
// 但 createRenderer, createBundleRender 必须接收一个返回 vue 实例的函数或 promise
// 所以直接使用 commonjs 模块
module.exports = context => {
  return new Promise((resolve, reject) => {
    const { app, router } = createRootApp.default();

    router.push(context.url);

    // onReady 回调在初次解析完成异步组件或钩子后只调用一次
    router.onReady(() => {
      const matched = router.getMatchedComponents();
      if (!matched.length) {
        return reject({ code: 404 });
      }

      resolve(app);
    }, reject);
    
  });
};