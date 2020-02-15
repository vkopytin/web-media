import express = require('express');
import { devConfig } from './devConfig';
import { expressConfig } from './express';
import { extraConfig } from './extra';
import { prodConfig } from './prodConfig';
import { routesConfig } from './routesConfig';


export = (app: express.Application) => {
    expressConfig(app);

    process.env.NODE_ENV === 'development'
        ? devConfig(app)
        : prodConfig(app);

    extraConfig(app);
    routesConfig(app);

    return app;
};
