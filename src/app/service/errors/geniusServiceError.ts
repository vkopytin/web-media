import { GeniusServiceResult } from '../results/geniusServiceResult';


class GeniusServiceError extends Error {

    static create<T>(message: string, details = {}) {
        return GeniusServiceResult.error<T, GeniusServiceError>(new GeniusServiceError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'GeniusServiceError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, GeniusServiceError.prototype);
    }
}

export { GeniusServiceError };
