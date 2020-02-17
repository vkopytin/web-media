import { SpotifyServiceResult } from '../results/spotifyServiceResult';


class SpotifyServiceUnexpectedError extends Error {

    static create(message: string, details = {}) {
        return SpotifyServiceResult.error(new SpotifyServiceUnexpectedError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'SpotifyServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyServiceUnexpectedError.prototype);
    }
}

export { SpotifyServiceUnexpectedError };
