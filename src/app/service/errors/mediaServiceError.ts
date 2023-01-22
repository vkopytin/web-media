import { Result } from '../../utils/result';

export class MediaServiceError extends Error {

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new MediaServiceError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'MediaServiceError';
        if ('stack' in details) {
            this.stack = (this.stack || '') + ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, MediaServiceError.prototype);
    }
}
