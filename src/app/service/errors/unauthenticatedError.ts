import { Result } from '../../utils/result';

class UnauthenticatedError extends Error {

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new UnauthenticatedError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'UnauthenticatedError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, UnauthenticatedError.prototype);
    }
}

export { UnauthenticatedError };
