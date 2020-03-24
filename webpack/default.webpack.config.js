require('dotenv').config()

const childProcess = require('child_process')
const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (options, workingDir) => {
  const CDN_PATH = options.CDN || '/';
  const PUBLIC_DIR = options.PUBLIC_DIR;
  const FILE_NAME_PATTERN = options.FILE_NAME_PATTERN;
  const revision = options.REVISION;

  const suppressPart = (pattern, options) => Object.keys(options)
    .reduce((res, key) => res.replace('[' + key + ']', options[key]), pattern);

  const fileLoaderOptions = {
  };
  // toDO: Check production config for webpack

  return {
    entry: {
      app: [path.join(workingDir, '../src/app/index')],
      vendor: [
        'react',
        'databindjs',
        'tslib',
        'jquery',
        'underscore',
        'utils'
      ]
    },
    output: {
      filename: suppressPart(FILE_NAME_PATTERN, {
        path: '',
        ext: 'js'
      }), // e.g. '[name].[hash].js'
      chunkFilename: suppressPart(FILE_NAME_PATTERN, {
        path: '',
        ext: 'js'
      }) // e.g. '[name].[hash].js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      modules: ['src', 'src/app', 'src/css', 'src/img', 'node_modules'],
      // enable require('<module-name>') to look into respected path
      alias: {
        app: path.resolve(workingDir, '..', 'src', 'app'),
        '~': path.resolve(workingDir),
        '../img': 'src/app/img',
        '../src/app/img': 'src/app/img',
        './src/app/img': 'src/app/img',
        'src/app/img': path.resolve(workingDir, '../src/app/img'),
        '../fonts': 'src/app/fonts',
        'src/app/fonts': path.resolve(workingDir, '../src/app/fonts'),
      }
    },
    plugins: [
      // new HtmlWebpackPlugin({
      //   filename: '../public/index.html',
      //   template: path.resolve(workingDir, '..', 'src', 'html.mustache'),
      //   inject: false,
      //   alwaysWriteToDisk: true,
      //   path: !DEBUG ? '/public' : ''
      //   template: 'index.html'
      // }),
      // new HtmlWebpackHarddiskPlugin(),
      new (function VersionInfo() {
        this.apply = function (compiler) {
          compiler.hooks.emit.tapAsync('VersionInfo', function (compilation, callback) {
            try {
              const stats = compilation.getStats().toJson();
              let commit;
              let version;
              try {
                version = childProcess.execSync('git rev-parse --short HEAD').toString().replace(/^\s|\s$/, '');
                commit = childProcess.execSync('git rev-parse HEAD').toString().replace(/^\s|\s$/, '');
              } catch (ex) {

              }
              const versionInfo = JSON.stringify({
                channel: process.env.NODE_ENV,
                css: suppressPart(FILE_NAME_PATTERN, {
                  path: '',
                  name: 'app',
                  ext: 'css',
                  hash: stats.hash
                }),
                vendor: suppressPart(FILE_NAME_PATTERN, {
                  path: '',
                  name: 'vendor',
                  ext: 'js',
                  hash: stats.hash
                }),
                app: suppressPart(FILE_NAME_PATTERN, {
                  path: '',
                  name: 'app',
                  ext: 'js',
                  hash: stats.hash
                }),
                hash: stats.hash,
                publicDir: PUBLIC_DIR,
                time: stats.time,
                version: version,
                commit: commit,
                cdn: CDN_PATH
              }, null, 4);

              compilation.assets['version.json'] = {
                source: function () {
                  return versionInfo;
                },
                size: function () {
                  return versionInfo.length;
                }
              };

              callback();
            } catch (ex) {
              console.log(ex);
              callback();
            }
          });
        }
      })
    ],
    resolveLoader: {
      alias: {
        'pegjs-ex-loader': path.join(workingDir, '../webpack/pegjs-loader')
      }
    },
    module: {
      rules: [{
        test: /\.pegjs$/,
        loader: 'pegjs-ex-loader?allowedStartRules[]=start&allowedStartRules[]=amount_and_unit'
      }, {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }, {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          logInfoToStdOut: true
        }
      }, {
        test: /\.mustache$/,
        loader: 'mustache-loader'
      }, {
        test: /libs\/jquery\/jquery-migrate-3\.0\.0/,
        loader: 'imports-loader?jQuery=jquery'
      }, {
        test: /libs\/jquery\/plugins\/jquery-tourbus/,
        loader: 'exports-loader?jQuery.fn.pickadate!imports-loader?jQuery=jquery'
      }, {
        test: /libs\/jquery\/plugins\/pickadate/,
        loader: 'exports-loader?jQuery.fn.pickadate!imports-loader?jQuery=jquery&jquery.migrate'
      }, {
        test: /libs\/jquery\/plugins\/timepicker/,
        loader: 'exports-loader?jQuery.fn.timepicker!imports-loader?jQuery=jquery&jquery.migrate'
      }, {
        test: /libs\/jquery\/plugins\/jquery\.mobile\.custom/,
        loader: 'imports-loader?jQuery=jquery&jquery.migrate'
      }, {
        test: /\.less$/,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // compiles Less to CSS
          'less-loader'
        ],
      }, {
        test: /\.s[ac]ss$/i,
          use: (process.env.NODE_ENV === 'development' ? [
            // Creates `style` nodes from JS strings
            'style-loader'
          ] : [{
          loader: MiniCssExtractPlugin.loader,
          options: {
              hmr: process.env.NODE_ENV === 'development',
          },
      }]).concat([
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader'
        ])
      }, {
        test: /\.png$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.jpg$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.svg$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.gif$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.woff$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.woff2$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.ttf$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.eot$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.otf$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }, {
        test: /\.swf$/,
        loader: 'file-loader',
        options: fileLoaderOptions
      }]
    }
  }
};
