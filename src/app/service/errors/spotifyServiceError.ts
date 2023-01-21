import { Result } from '../../utils/result';

class SpotifyServiceError extends Error {

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new SpotifyServiceError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'SpotifyServiceError';
        if ('stack' in details) {
            this.stack = (this.stack || '') + ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyServiceError.prototype);
    }
}

export { SpotifyServiceError };
