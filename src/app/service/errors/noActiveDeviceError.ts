import { Result } from '../../utils/result';

class NoActiveDeviceError extends Error {

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new NoActiveDeviceError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'NoActiveDeviceError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, NoActiveDeviceError.prototype);
    }
}

export { NoActiveDeviceError };
