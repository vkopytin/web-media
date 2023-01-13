import { ServiceResult } from '../../base/serviceResult';
import { SpotifyService } from '../spotify';


class SpotifyServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T, Y extends Error = Error>(val: T): ServiceResult<T, Y> {
        return new SpotifyServiceResult(val, null as unknown as Y);
    }

    static error<T, Y extends Error = Error>(val: Y): ServiceResult<T, Y> {
        const error = new SpotifyServiceResult(null as T, val);
        error.isError = true;

        return error;
    }
}

export { SpotifyServiceResult };
