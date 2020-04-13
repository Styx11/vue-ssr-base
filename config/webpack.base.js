const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin-webpack4');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd
    ? 'production'
    : 'development',
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash].js', //hash of chunk content
  },
  resolve: {
    alias: {
      'public': path.resolve(__dirname, '../public')
    }
  },
  devtool: 'cheap-source-map',

  optimization: {
    minimize: true,

    // 更改为路径命名规则
    namedModules: true,
    namedChunks: true,

    // 相当于 webpack.DefinePlugins 中设置 'process.env.NODE_ENV: JSON.stringifiy(...)'
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  module: {
    rules: [
      { test: /\.vue$/, use: 'vue-loader' },

      // 它会应用到普通的 `.css` 文件
      // 以及 `.vue` 文件中的 `<style>` 块
      // 使用 render template 选项时会提取并注入 css 资源
      { 
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      }
    ]
  },

  plugins: [
    // 将你定义过的其它规则复制并应用到 .vue 文件里相应语言的块。
    // 例如，如果你有一条匹配 /\.js$/ 的规则，那么它会应用到 .vue 文件里的 <script> 块。
    new VueLoaderPlugin(),
  ]
};