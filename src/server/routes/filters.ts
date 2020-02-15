import * as express from 'express';
import * as _ from 'underscore';


const cookieExists = (req: express.Request, key, value) => {
    return (new RegExp(key + '\s*=\s*' + value)).test(req.header('cookie'));
};

export function endsWithSlash(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.path.slice(-1) === '/') {
        next();
    } else {
        next('route');
    }
}

export function HTML_ACCEPTED(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.accepts([
        'text/html',
        'application/xhtml+xml',
        'application/xml',
        'application/*',
        'text/*',
        '*/html',
        '*/*'
    ]) === '*/*') {
        next('route');
    } else {
        next();
    }
}
