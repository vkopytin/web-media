import stringify = require('json-stringify-safe');
import util = require('util');
import { btoa } from './utils';


const encode = function(data) {
    return btoa(stringify(data));
};

class Logger {
    static init(res) {
        return this.currentInstance = new Logger(res, process.env.DEBUG_LOG ? ~~process.env.DEBUG_LOG : 2);
    }

    private static currentInstance = null as Logger;

    static get current() {
        return this.currentInstance;
    }

    data = {
        version: '0.1',
        columns: ['log', 'backtrace', 'type'],
        rows: []
    };

    constructor(private res, private level = 0) {

    }

    log(...args) {
        return this.logInternal('log', 3, ...args);
    }
    info(...args) {
        return this.logInternal('info', 3, ...args);
    }
    debug(...args) {
        return this.logInternal('debug', 3, ...args);
    }
    table(...args) {
        return this.logInternal('table', 3, ...args);
    }
    warn(...args) {
        return this.logInternal('warn', 3, ...args);
    }
    error(...args) {
        return this.logInternal('error', 3, ...args);
    }
    group(...args) {
        return this.logInternal('group', 3, ...args);
    }
    groupEnd(...args) {
        return this.logInternal('groupEnd', 3, ...args);
    }
    groupCollapsed(...args) {
        return this.logInternal('groupCollapsed', 3, ...args);
    }
    dir(obj) {
        this.logInternal('', 4, util.inspect(obj));
    }
    async groupAs<T>(name: string, f: () => T): Promise<T> {
        this.logInternal('groupCollapsed', 4, name);
        try {
            return await f();
        } catch (ex) {
            this.logInternal('error', 4, ex);
        } finally {
            this.logInternal('groupEnd', 4);
        }
    }
    assert(test, msg) {
        if (!test) {
            this.logInternal('error', 4, 'Assertion failed: ' + msg);
        }
    }
    groupAssert(test, msg, f) {
        if (!test) {
            this.logInternal('groupCollapsed', 4, 'Assertion failed: ' + msg);
            try {
                return f();
            } catch (ex) {
                this.logInternal('error', ex);
            } finally {
                this.logInternal('groupEnd', 4);
            }
        }
    }

    private logInternal(type, l, ...args) {
        try {
            const row = [
                Array.prototype.slice.call(args).map(function (a) {
                    if (!a || typeof a !== 'object') { return a + ''; }
                    a.___class_name = a.constructor.name;
                    return a;
                }),
                new Error().stack.split('\n')[l].trim(),
                type
            ];
            this.data.rows.push(row);
            if (this.level > 1 && !this.res.headersSent) {
                this.res.set('X-ChromeLogger-Data', encode(this.data));
            }
            // tslint:disable-next-line: no-console
            this.level > 0 && console.log([row[0], row[1]].join(' => '));
        } catch (e) {
            this.data.rows.pop();
            this.logInternal('error', 4, e.toString());
        }
    }
}

const serverLogger = function (req, res, next) {
    res.console = new Logger(res);

    if (typeof next === 'function') {
        next();
    }
};

export { Logger, serverLogger };
