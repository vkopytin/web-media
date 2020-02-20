import fs = require('fs');
import http = require('http');
import https = require('https');
import { app } from './main';


// tslint:disable-next-line: no-console
const warn = (...args) => console.log(...args);

const privateKey  = fs.readFileSync('./selfsigned.key', 'utf8');
const certificate = fs.readFileSync('./selfsigned.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };

let httpServer = null;
let httpsServer = null;
const options = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.SERVER_PORT || 8081,
    PPORT: process.env.SERVER_PPORT || 8080
};

try {
    httpServer = http.createServer(app);
    httpServer.listen(options.PPORT, () => {
        warn('The server is running in port localhost: ', options.PPORT);
    });

} catch (ex) {
    setTimeout(() => { throw ex; });
}

try {
    httpsServer = https.createServer(credentials, app);
    httpsServer.listen(options.PORT, () => {
        warn('The server is running in port localhost: ', options.PORT);
    });
} catch (ex) {
    setTimeout(() => { throw ex; });
}

if (process.env.NODE_ENV === 'development') {
    let currentApp = app;

    if ((module as any).hot) {
        const newApp = require('./main').app;
        (module as any).hot.accept('./index.ts', () => {
            httpServer.removeListener('request', currentApp);
            httpServer.on('request', newApp);

            httpsServer.removeListener('request', currentApp);
            httpsServer.on('request', newApp);
            currentApp = newApp;
        });
        (module as any).hot.accept('./main.ts', () => {
            httpServer.removeListener('request', currentApp);
            httpServer.on('request', newApp);

            httpsServer.removeListener('request', currentApp);
            httpsServer.on('request', newApp);
            currentApp = newApp;
        });
    }
}
