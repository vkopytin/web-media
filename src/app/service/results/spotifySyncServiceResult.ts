import { ServiceResult } from '../../base/serviceResult';
import { SpotifySyncService } from '../spotifySyncService';


class SpotifySyncServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T>(val: T) {
        return new SpotifySyncServiceResult(val, null as Error);
    }

    static error<Y extends Error>(val: Y) {
        const error = new SpotifySyncServiceResult(null as SpotifySyncService, val);
        error.isError = true;

        return error;
    }
}

export { SpotifySyncServiceResult };
