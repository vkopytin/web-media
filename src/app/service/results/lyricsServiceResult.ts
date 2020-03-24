import { ServiceResult } from '../../base/serviceResult';


class LyricsServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T, Y extends Error = Error>(val: T) {
        return new LyricsServiceResult(val, null as Y);
    }

    static error<T, Y extends Error = Error>(val: Y) {
        const error = new LyricsServiceResult(null as T, val);
        error.isError = true;

        return error;
    }
}

export { LyricsServiceResult };
