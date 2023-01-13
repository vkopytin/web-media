import { ServiceResult } from '../../base/serviceResult';


class LoginServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E | null) {
        super(result, error);
    }

    static success<T, Y extends Error = Error>(val: T) {
        return new LoginServiceResult(val, null as Y | null);
    }

    static error<T, Y extends Error = Error>(val: Y) {
        const error = new LoginServiceResult(null as T, val);
        error.isError = true;

        return error;
    }
}

export { LoginServiceResult };
