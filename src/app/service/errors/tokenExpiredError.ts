import { SpotifyServiceResult } from '../results/spotifyServiceResult';


class TokenExpiredError extends Error {

    static create<T>(message: string, details = {}) {
        return SpotifyServiceResult.error<T, TokenExpiredError>(new TokenExpiredError(message, details));
    }

    constructor(public msg: string, public details: { stack?: string }) {
        super(msg);

        this.name = 'TokenExpiredError';
        if ('stack' in details) {
            this.stack = ([] as string[]).concat(msg, details.stack || '').join('\r\n');
        }

        Object.setPrototypeOf(this, TokenExpiredError.prototype);
    }
}

export { TokenExpiredError };
