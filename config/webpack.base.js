const path = require('path');

module.exports = {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].bundle.js'
  },
  devtool: 'cheap-source-map',

  optimization: {
    minimize: true,

    // 相当于 webpack.DefinePlugins 中设置 'process.env.NODE_ENV: JSON.stringifiy(...)'
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  module: {
    rules: [

    ]
  },

  plugins: [

  ]
};