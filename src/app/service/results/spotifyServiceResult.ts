import { ServiceResult } from '../../base/serviceResult';
import { SpotifyService } from '../spotify';


class SpotifyServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T>(val: T) {
        return new SpotifyServiceResult(val, null as Error);
    }

    static error<Y extends Error>(val: Y) {
        const error = new SpotifyServiceResult(null as SpotifyService, val);
        error.isError = true;

        return error;
    }
}

export { SpotifyServiceResult };
