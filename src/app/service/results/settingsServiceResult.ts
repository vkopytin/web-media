import { ServiceResult } from '../../base/serviceResult';
import { SettingsService } from '../settings';


class SettingsServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T>(val: T) {
        return new SettingsServiceResult(val, null as Error);
    }

    static error<Y extends Error>(val: Y) {
        const error = new SettingsServiceResult(null as SettingsService, val);
        error.isError = true;

        return error;
    }
}

export { SettingsServiceResult };
