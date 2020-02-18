import { ServiceResult } from '../../base/serviceResult';
import { SpotifyPlayerService } from '../spotifyPlayer';


class SpotifyPlayerServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T>(val: T) {
        return new SpotifyPlayerServiceResult(val, null as Error);
    }

    static error<Y extends Error>(val: Y) {
        const error = new SpotifyPlayerServiceResult(null as SpotifyPlayerService, val);
        error.isError = true;

        return error;
    }
}

export { SpotifyPlayerServiceResult };
