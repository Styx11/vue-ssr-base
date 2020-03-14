const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const baseConfig = require('./webpack.base');
const nodeExternals = require('webpack-node-externals');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');

module.exports = merge(baseConfig, {
  name: 'server',
  target: 'node',
  entry: {
    server: path.resolve(__dirname, '../src/server.entry.js'),
  },
  output: {
    libraryTarget: 'commonjs2'
  },

  // 外置 node 环境依赖
  externals: nodeExternals({
    whitelist: /\.css$/
  }),

  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': '"server"'
    }),
    new VueSSRServerPlugin(),
  ]
})