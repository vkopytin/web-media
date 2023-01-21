import { Result } from '../../utils/result';

class SpotifyPlayerServiceUnexpectedError extends Error {

    static of<T>(message: string, details = {}): Result<Error, T> {
        return Result.error<Error, T>(new SpotifyPlayerServiceUnexpectedError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'SpotifyPlayerServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyPlayerServiceUnexpectedError.prototype);
    }
}

export { SpotifyPlayerServiceUnexpectedError };
