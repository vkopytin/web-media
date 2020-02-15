import * as _ from 'underscore';
import { Logger } from '../logger';
import { RMService } from '../service/connections';
import { JsonResult } from './jsonresult';
import { RedirectResult } from './redirectresult';
import { ViewResult } from './viewresult';


const template = (str) => {
    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    const body = 'var p=[],print=function(){p.push.apply(p,arguments);};' +

        // Introduce the data as local variables using with(){}
        'with(obj){p.push(\'' +

        // Convert the template into pure JavaScript
        str.replace(/@(?<=@)[^@;\s]+[;\s]?/gi, (a) => {
            return '<%=' + a.replace(/^@|;?$/gi, '') + '%>';
        })
            .replace(/[\r\t\n]/g, ' ')
            .split('<%').join('\t')
            .replace(/((^|%>)[^\t]*)'/g, '$1\r')
            .replace(/\t=(.*?)%>/g, '\',$1,\'')
            .split('\t').join('\');')
            .split('%>').join('p.push(\'')
            .split('\r').join('\\\'')
        + '\');}return p.join(\'\');';

    const fn = new Function('obj', body);

    // Provide some basic currying to the user
    return fn;
};

const debugGroupAs = (message: string) => (a, b, c) => {
    const origMethod = c.value,
        render = template(message);
    c.value = function (this: Controller, ...args) {
        return this.debug.groupAs(render(this), () => origMethod.apply(this, args));
    };
};

const action = (name: string) => (a, b, c) => {
    c.value = (new Function(`return function (call) {\
        return function ${name} () { return call.apply(this, arguments) };\
    };`)())(c.value);
};

const handler = (name: string) => <T>(constructor: new (...args) => T) => {
    const child = (new Function(`return function (call) {\
        return function ${name} () { return call.apply(this, arguments) };\
    };`)())(constructor);
    child.prototype = constructor.prototype;
    child.prototype.constructor = child;
    return child;
};


class Controller {
    Data = {};
    debug = Logger.current;

    constructor(protected request, protected response, protected rm: RMService) {
    }

    view(viewName = null, data: {} = this.Data) {
        return new ViewResult({
            name: viewName,
            data: data
        });
    }
    json(data: {} = this.Data) {
        return new JsonResult({ data });
    }
    redirect(redirectUri: string | { redirectUri: string, [key: string]: any }) {
        if (_.isString(redirectUri)) {
            return new RedirectResult({
                redirectUri: redirectUri as string
            });
        }
        return new RedirectResult(redirectUri as any);
    }
}

export { action, handler, Controller, debugGroupAs };
