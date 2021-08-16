// set up ========================
import dotenv = require('dotenv');
dotenv.config();

import express = require('express');
import fs from 'fs';
import proxy = require('http-proxy-middleware');
import morgan from 'morgan'; // log requests to the console (express4)
import path from 'path';
import webpack = require('webpack');
import webpackConfig = require('../../../webpack/dev.webpack.config');


// tslint:disable-next-line: no-console
const warn = (...args) => console.log(...args);

const devConfig = (app: express.Application) => {
    warn('...starting development mode...');

    if (true) {
        const compiler = webpack({
            ...webpackConfig,
            entry: {
                ...webpackConfig.entry,
                app: ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&overlay=false',
                    ...webpackConfig.entry.app
                ]
            }
        });
        let devMiddleware;
        app.use(devMiddleware = require('webpack-dev-middleware')(
            compiler, {
                noInfo: true,
                publicPath: webpackConfig.output.publicPath
            })
        );
        (compiler as any).plugin('done', stats => {
            const version = {
                channel: process.env.NODE_ENV,
                css: `app.${stats.hash}.css`,
                vendor: `vendor.${stats.hash}.js`,
                app: `app.${stats.hash}.js`,
                hash: stats.hash,
                publicDir: process.env.PUBLIC_DIR,
                time: stats.time
            };
            const versionInfo = JSON.stringify(version, null, 4);
            app.set('version', version);
            fs.writeFile(path.join(__dirname, webpackConfig.output.publicPath, 'version.json'), versionInfo, (err) => {
                if (err) {
                // tslint:disable-next-line: no-console
                console.log(err);
                }
                // tslint:disable-next-line: no-console
                console.log('Successfully Written to version.json');
            });
        });

        app.use(require('webpack-hot-middleware')(compiler));
    } else {
        app.use('/bower_components', express.static(path.join(process.cwd(), 'bower_components'))); // set the static files location of bower_components
        app.use(morgan('development'));  // log every request to the console
        app.use('/static', express.static(path.join(process.cwd(), 'bundle')));
    }
    app.use('/icons', express.static(path.join(process.cwd(), 'src/images')));

    app.use('/bower_components', express.static(path.join(process.cwd(), 'bower_components'))); // set the static files location of bower_components
    app.use(morgan('development'));  // log every request to the console

    return app;
};

export { devConfig };
