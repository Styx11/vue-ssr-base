# Vue-SSR-Demo

> basic contraction of vue-ssr project

## 📝Desc

本 repo 只包含一个简单的 Vue SSR 样例，重点在于展示服务端渲染应有的基本配置

由于服务端渲染的配置几乎包含了现代前端构建的所有知识，所以我想借这个项目抽离出具有普适性的基础结构，并方便以后的使用

我额外写了几篇关于这个构建过程的总结，其中包括 Webpack 中间件的源码解析，希望对你有所帮助：

[上篇](https://styx11.github.io/blog/FontEnd_Construction/ssr_first_part.html) 介绍开始一个 Vue SSR 项目所需的基础配置

[中篇](https://styx11.github.io/blog/FontEnd_Construction/ssr_second_part.html) 介绍 Vue SSR 应用如何与 Koa2 服务器结合

[下篇](https://styx11.github.io/blog/FontEnd_Construction/ssr_third_part.html) 重点总结基于 Webpack4 和 Koa2 的开发模式，其中涉及中间件的适配

[devMiddleware 源码解析](https://styx11.github.io/blog/FontEnd_Construction/devMiddleware.html) 总结我在适配`webpack-dev-middleware`中间件过程中通过阅读源码学习到的 Webpack 和它是如何协调工作的

## ✨Features
这个基础结构提供了以下功能：
* 基于`.vue`文件
* `vue-router`共用路由
* 基于 Wepack4 的构建配置
* 一个 Koa2 服务器
* `micro-cacheing`缓存策略
* `@koa/router`中间件提供路由功能
* `koa-static-server`中间件提供文件服务
* 基于 Webpack4 和 Koa2 的开发模式

## 🚨Notes
* 本 repo 使用 webpack v4+，某些你所熟知的配置，例如 `webpack.optimize.CommonsChunkPlugin` 会不可用，具体的迁移须知参考[To v4 from v3](https://webpack.docschina.org/migrate/4/)

* 本 repo 使用 webpack v4+，其中将 `es6` 模块导出为 `commonjs2` 模块时会将导出函数或默认（default）内容挂载在 `module` 对象上，这会导致   `createBundleRenderer` 无法创建 `renderer`（已知的 `vue-server-renderer v2.6.11` 版本），而不是像 [Vue-SSR](https://ssr.vuejs.org/zh/guide/structure.html#entry-server-js) 文档那样覆盖 `module` 对象，所以在 [server.entry.js](./src/server.entry.js) 中我们直接使用了 `commonjs2` 模块做 **“中间适配”**

* 使用时请确保某些构建工具的版本，例如 Vue 文件编译器 `vue-template-compiler` 必须与 `vue` 版本匹配

## 📦Build
```
# install dependencies
npm install

# build for production with minification
npm run build

# dev mode in webpack4
npm run dev

# start the production node server
npm run start

```

## 📄LICENSE
MIT.