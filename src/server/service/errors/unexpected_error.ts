import { DummyResult } from '../results/dummy_result';


class DummyUnexpectedError extends Error {

    static create(message: string, details = {}) {
        return DummyResult.error(new DummyUnexpectedError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'DummyUnexpectedError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, DummyUnexpectedError.prototype);
    }
}

export { DummyUnexpectedError };
