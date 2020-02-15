/* eslint-disable */
require('dotenv').config()

// SESSIONID can change everytime
// it is to enable requests that are available for logged in users
// .e.g. /core/roar/posts/1598027/history/21054
// more comes in proxy statements from devServer.proxy
var SESSIONID = process.env.SESSIONID || 'gxiy5s3jrdfhj45oqk772jap4t0izl38';
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const config = require('./dev.webpack.config')
const fs = require('fs');

const ip = process.env.APP_IP || '0.0.0.0'
const port = (+process.env.SERVER_PORT) || 3001

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  watchOptions: {
    poll: 1000,
    aggregateTimeout: 300,
    ignored: /node_modules/
  },
  overlay: true,
  host: ip,
  stats: 'normal',
  historyApiFallback: true,
  https: { // make upload image working over proxy requests, since request comes to hardcoded https
      key: fs.readFileSync('selfsigned.key'),
      cert: fs.readFileSync('selfsigned.crt'),
      ca: fs.readFileSync('selfsigned.pem'),
  },
  contentBase: 'public',
  compress: true,
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
}).listen(port, ip, function (err) {
  if (err) {
    return console.log(err)
  }

  console.log(`Listening at http://${ip}:${port}`)
})
