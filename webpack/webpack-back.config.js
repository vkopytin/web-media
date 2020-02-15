const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StartServerPlugin = require('start-server-webpack-plugin');

  
module.exports = {
    mode: 'production',
    target: 'node',
    // devtool: "eval-source-map",
    entry: {
        app: [path.join(__dirname, '../src/server/index')],
    },
    output: {
        path: path.resolve(__dirname, '../bundle'),
        filename: 'server.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.mustache']
    },
    module: {
        rules: [{
            // Test for a polyfill (or any file) and it won't be included in your
            // bundle
            test: /\/config\/devConfig.ts$/,
            use: 'null-loader',
        }, {
            test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/,
        }, {
            test: /\.mustache$/, loader: 'mustache-loader'
        }]
    },
    externals: [nodeExternals({ })],
    node: {
        __dirname: false
    }
};
