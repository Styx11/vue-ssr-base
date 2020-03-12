# Vue-SSR-Demo

> basic configs of vue-ssr

## 📝Desc

本 repo 只包含一个简单的 Vue SSR 样例，重点在于展示服务端渲染应有的基本配置

由于服务端渲染的配置几乎包含了现代前端构建的所有知识，所以我想借这个项目抽离出具有普适性的基础结构，并方便以后的使用

## 🚨Notes
* 本 repo 使用 webpack v4+，某些你所熟知的配置，例如 `webpack.optimize.CommonsChunkPlugin` 会不可用

* 本 repo 使用 webpack v4+，其中将 `es6` 模块导出为 `commonjs2` 模块时会将导出函数或默认（default）内容挂载在 `module` 对象上，这会导致   `createBundleRenderer` 无法创建 `renderer`（已知的 `vue-server-renderer v2.6.11` 版本），而不是像 [Vue-SSR](https://ssr.vuejs.org/zh/guide/structure.html#entry-server-js) 文档那样覆盖 `module` 对象，所以在 [server.entry.js](./src/server.entry.js) 中我们直接使用了 `commonjs2` 模块做 **“中间适配”**

* 使用时请确保某些构建工具的版本，例如 Vue 文件编译器 `vue-template-compiler` 必须与 `vue` 版本匹配

## 📦Build
```
# install dependencies
npm install

# build for production with minification
npm run build

```

## 📄LICENSE
MIT.