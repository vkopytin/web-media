// alpha environment
const {
  combine,
  plugins,
  output,
  module_rules
} = require('./config');
const initConfig = require('./default.webpack.config');


const newConfig = (function (options) {
  const config = {
    ...initConfig(options, __dirname),
    devtool: 'source-map',
    mode: 'development',
    optimization: {
      minimize: false,
      splitChunks: {
        chunks: 'async',
        cacheGroups: {
          vendors: false,
          vendor: {
            name: 'vendor',
            test: 'vendor',
            enforce: true,
            chunks: 'all'
          },
          default: false
        }
      }
    }
  };

  return combine(
    output.publicPath,
    output.path,
    plugins.cleanCleanWebpackPlugin,
    plugins.extra,
    module_rules
  )(config, options);
})({
  CDN: '/static/',
  PUBLIC_DIR: 'app/',
  FILE_NAME_PATTERN: '[name].[ext]?hash=[hash]',
  ...process.env
});

module.exports = newConfig;
