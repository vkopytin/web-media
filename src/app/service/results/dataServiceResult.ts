import { ServiceResult } from '../../base/serviceResult';
import { DataService } from '../dataService';


class DataServiceResult<T, E extends Error> extends ServiceResult<T, E> {

    constructor(result: T, error: E) {
        super(result, error);
    }

    static success<T>(val: T) {
        return new DataServiceResult(val, null as Error);
    }

    static error<Y extends Error>(val: Y) {
        const error = new DataServiceResult(null as DataService, val);
        error.isError = true;

        return error;
    }
}

export { DataServiceResult };
