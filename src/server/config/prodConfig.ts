import compression from 'compression';
import express = require('express');
import path from 'path';


// tslint:disable-next-line: no-console
const warn = (...args) => console.log(...args);

const prodConfig = (app: express.Application) => {
    warn(`...srating server on ${process.env.NODE_ENV}`);
    app.use(compression());
    app.use('/static', express.static(path.join(process.cwd(), 'bundle'), { maxAge: '7d' })); // set the static files location /public/img will be /img for users

    return app;
};

export { prodConfig };
