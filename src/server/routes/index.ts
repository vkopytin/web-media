import express = require('express');
import routesInfo = require('./info');
import routesHome = require('./routes');


function mainRoutes(app: express.Application) {
    app.use('/', routesInfo);
    app.use('/', routesHome);
}

export = mainRoutes;
