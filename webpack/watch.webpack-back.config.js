const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StartServerPlugin = require('./restart-server-plugin');

  
module.exports = {
    mode: 'development',
    target: 'node',
    //devtool: "inline-source-map",
    entry: {
        app: ['webpack/hot/poll?1000', path.join(__dirname, '../src/server/index')],
    },
    output: {
        path: path.resolve(__dirname, '../bundle'),
        filename: 'server.js',
        hotUpdateChunkFilename: '.hot/[id].[hash].hot-update.js',
        hotUpdateMainFilename: '.hot/[hash].hot-update.json'
    },
    optimization: {
        minimize: false
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.mustache']
    },
    module: {
        rules: [{
            test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/,
        }, {
            test: /\.mustache$/, loader: 'mustache-loader'
        }, {
            test: /\.css$/,
            use: [{
                loader: 'style-loader'
              }, {
                loader: 'css-loader',
                options: {
                    importLoaders: 1
                }
            }, {
                loader: 'resolve-url-loader'
            }, {
                loader: 'postcss-loader'
            }]
        }, {
            test: /\.s[ac]ss$/i,
            use: [
                // Creates `style` nodes from JS strings
                'style-loader',
                // Translates CSS into CommonJS
                'css-loader',
                // Compiles Sass to CSS
                'sass-loader'
            ]
        }, {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: [/node_modules/]
        }]
    },
    externals: [nodeExternals({
        whitelist: ['webpack/hot/poll?1000'],
    })],
    plugins: [
        new StartServerPlugin({
            name: 'server.js',
            nodeArgs: ['--inspect=9229'], // allow debugging
            keyboard: true,
            restartable: true,
            signal: false
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    node: {
        __dirname: false
    }
};
