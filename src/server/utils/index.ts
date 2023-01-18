import url = require('url');
import { Request } from 'express';


export function getCurrentUrl(req: Request): url.UrlWithStringQuery {
    const xhostname = req.header('X-Forwarded-Host');
    const xprotocol = req.header('X-Forwarded-Proto');
    const originalUrl = `${xprotocol || req.protocol}://${xhostname}${req.originalUrl}`;

    if (!xhostname && process.env.PROXY_TARGET) {
        return url.parse(`${process.env.PROXY_TARGET}${req.originalUrl}`);
    }

    if (!xhostname) {
        throw new Error('Server fail... Reason: X-Forwarded-Host is empty or doesn\'t exists');
    }

    return url.parse(originalUrl);
}

export function getSessionIdCookie(req: Request): string {
    if (process.env.SESSIONID) {

        return `sessionid=${process.env.SESSIONID}; _gat=1`;
    }

    return `sessionid=${req.cookies.sessionid}`;
}

/**
 * Will match one and only one of the string `false|0|off|null|undefined` regardless
 * of capitalization and regardless off surrounding white-space.
 */
export function tryValueFromString(strVal: string): boolean {
    const regex = /^\s*(false|0|off|null|undefined)\s*$/i;

    return !(!strVal || regex.test(strVal));
}

export function atob(str: string): string {
    return Buffer.from(str, 'base64').toString('binary');
}

export function btoa(str: string): string {
    return Buffer.from('' + str, 'binary').toString('base64');
}
