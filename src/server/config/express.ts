import cookieParser from 'cookie-parser';
import express = require('express');
import helmet from 'helmet'; // Security
import { Logger } from '../logger';


const expressConfig = (app: express.Application) => {
    app.all('*', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Max-Age', 86400);
        next();
    });

    app.use(helmet());
    app.use(cookieParser());

    app.use((req, res, next) => {
        Logger.init(res);

        next();
    });

    return app;
};

export { expressConfig };
