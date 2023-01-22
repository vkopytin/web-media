import { Result } from '../../utils/result';

export class RemotePlaybackServiceUnexpectedError extends Error {

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new RemotePlaybackServiceUnexpectedError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'RemotePlaybackServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, RemotePlaybackServiceUnexpectedError.prototype);
    }
}
