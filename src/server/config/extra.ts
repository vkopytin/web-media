import bodyParser from 'body-parser'; // pull information from HTML POST (express4)import * as express from 'express';
import express = require('express');
import methodOverride from 'method-override'; // simulate DELETE and PUT (express4)
import path from 'path';
import { renderView } from '../views';


const extraConfig = (app: express.Application) => {
    app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
    app.use(bodyParser.json()); // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());

    app.set('view', function (name, options) {
        const engines = options.engines;
        this.ext = path.extname(name);
        this.name = this.path = name;
        this.render = function (opts, next) {
            engines['.mmm'](this.name, opts, next);
        };
    });
    app.engine('.mmm', async (templatePath, viewResult: { viewData; }, next) => {
        try {
            return renderView(templatePath, {
                ...viewResult.viewData,
                versionInfo: app.get('version')
            }, (err, result) => {
                if (err) {
                    return next(err, null);
                }
                next(null, result);
            });
        } catch (ex) {
            next(ex, null);
        }
    });

    return app;
};

export { extraConfig };
