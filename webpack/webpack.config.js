const { combine, output } = require('./config');
const initConfig = require('./default.webpack.config');

const newConfig = (function (options) {
  const config = {
    ...initConfig(options)
  }
  return combine(
    output.publicPath,
    output.path
  )(config, options);
})({
  PUBLIC_DIR: '/app/',
  FILE_NAME_PATTERN: '[name].[hash].[ext]',
  ...process.env
});

module.exports = newConfig;
