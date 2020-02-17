import { ServiceResult } from '../../base/service_result';


class DummyResult<T> extends ServiceResult<T, Error> {

    static success<T>(val: T) {
        return new DummyResult(val, null);
    }

    static error<Y extends Error>(val: Y) {
        const error = new DummyResult(null, val);
        error.isError = true;

        return error;
    }
}

export { DummyResult };
