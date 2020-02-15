import Hogan = require('hogan.js');
import util = require('util');
import { btoa } from '../utils';


const templates = {
    layout: require('./layout'),
    'home/index': require('./home/index')
};

const btoaFilter = function () {

    return function (str, a) {
        try {
            Hogan.cache = {};
            const t = Hogan.compile(str),
                html = t.render(this, this['@partials']);

            return btoa(html);
        } catch (ex) {
            return require('util').inspect(ex, false, 100);
        }
    };
};

const renderView = (filePath: string, options: {}, callback: (err: any, result?: string) => any) => {
    try {
        const template = templates[filePath],
            html = templates.layout({
                btoa: btoaFilter,
                ...options,
                '@partials': {
                    content: template({ btoa: btoaFilter, ...options })
                }
            }, {
                content: template({ btoa: btoaFilter, ...options })
            });
        callback(null, html);
    } catch (ex) {
        callback(ex);
    }
};

const renderHtml = (
    filePath: string,
    contentHtml: string,
    options: {},
    callback: (err: any, result?: string) => any
) => {
    try {
        const template = templates[filePath],
            content = template({
                btoa: btoaFilter,
                '@partials': {
                    content: contentHtml,
                    ...options
                },
                ...options
            }, {
                content: contentHtml
            }),
            html = templates.layout({
                btoa: btoaFilter,
                '@partials': {
                    content: content,
                    ...options
                },
                ...options
            }, {
                content: content
            });
        callback(null, html);
    } catch (ex) {
        callback(ex);
    }
};

export { renderView, renderHtml };
