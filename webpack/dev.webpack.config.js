const path = require('path');
const webpack = require('webpack');
const initConfig = require('./default.webpack.config');
const ip = process.env.APP_IP || '0.0.0.0';
const port = (+process.env.SERVER_PORT) || 3000;
const sport = (+process.env.SERVER_SPORT) || 3443;


const defaultConfig = initConfig({
  FILE_NAME_PATTERN: '[name].[hash].[ext]',
  ...process.env
}, path.join(__dirname)); //toDO: do something here

const newConfig = {
  devServer: {
    overlay: false,
  },
  mode: 'development',
  ...defaultConfig,
  output: {
    ...defaultConfig.output,
    publicPath: '/'
  },
  watch: true,
  devtool: 'eval',
  entry: {
    ...defaultConfig.entry,
    app: [
      `webpack-dev-server/client?https://${ip}:${port}`,
      'webpack/hot/only-dev-server',
      ...defaultConfig.entry.app
    ]
  },
  optimization: {
    noEmitOnErrors: true,
    namedModules: true,
  },
  plugins: [
    ...defaultConfig.plugins,
    new webpack.HotModuleReplacementPlugin()
  ],
  resolve: {
    ...defaultConfig.resolve,
    alias: {
      ...defaultConfig.resolve.alias
    }
  },
  module: {
    ...defaultConfig.module,
    rules: [...defaultConfig.module.rules, {
      test: /\.css$/,
      loader: 'style-loader!css-loader!resolve-url-loader!postcss-loader'
    }]
  }
};

module.exports = newConfig;
