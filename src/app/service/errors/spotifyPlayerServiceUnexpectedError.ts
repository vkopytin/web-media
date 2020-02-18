import { SpotifyPlayerServiceResult } from '../results/spotifyPlayerServiceResult';


class SpotifyPlayerServiceUnexpectedError extends Error {

    static create(message: string, details = {}) {
        return SpotifyPlayerServiceResult.error(new SpotifyPlayerServiceUnexpectedError(message, details));
    }

    constructor(public msg, public details) {
        super(msg);

        this.name = 'SpotifyPlayerServiceUnexpectedError';
        if ('stack' in details) {
            this.stack = [].concat(msg, details.stack).join('\r\n');
        }

        Object.setPrototypeOf(this, SpotifyPlayerServiceUnexpectedError.prototype);
    }
}

export { SpotifyPlayerServiceUnexpectedError };
