import { ServiceResult } from '../../base/serviceResult';
import { SpotifySyncService } from '../spotifySyncService';


class SpotifySyncServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T>(val: T) {
        return new SpotifySyncServiceResult(val, null as Error);
    }

    static error<R, Y extends Error = Error>(val: Y) {
        const error = new SpotifySyncServiceResult(null as R, val);
        error.isError = true;

        return error;
    }
}

export { SpotifySyncServiceResult };
