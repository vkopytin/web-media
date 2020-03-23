import { GeniusServiceResult } from '../results/geniusServiceResult';


class GeniusServiceUnexpectedError extends Error {

    static create<T>(message: string, details = {}) {
        return GeniusServiceResult.error<T, GeniusServiceUnexpectedError>(new GeniusServiceUnexpectedError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'GeniusServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, GeniusServiceUnexpectedError.prototype);
    }
}

export { GeniusServiceUnexpectedError };
