import express = require('express');
import mainRoutes = require('../routes');


const routesConfig = (app: express.Application) => {

    // Setting routes
    mainRoutes(app);

    app.get('/', (req, res) => {
        res.redirect('/index');
    });

    return app;
};

export { routesConfig };
