const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const ManifestPlugin = require('webpack-manifest-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');

module.exports = merge(baseConfig, {
  name: 'client',
  entry: {
    client: path.resolve(__dirname, '../src/client.entry.js'),
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [ 'babel-loader' ]
      }
    ]
  },

  optimization: {

    // 默认使用 webpack v4+ 提供的全新的通用分块策略
    // 以下注释以 webpack v4 以下版本作对比
    // chunk 相关配置只应用在 client

    // spliteChunks 相当于 CommonsChunkPlugins vendor
    splitChunks: {
      chunks: 'all'
    },

    // runtimeChunks 相当于 CommonsChunkPlugins 中的 'runtime'
    // 这将 runtime chunk 抽离出来公用
    runtimeChunk: {
      name: 'runtime'
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': '"client"'
    }),
    new ManifestPlugin(),
    new VueSSRClientPlugin(),
  ]
});