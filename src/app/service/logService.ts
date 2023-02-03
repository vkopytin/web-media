import { Result } from '../utils/result';
import { State } from '../utils/databinding';

export class LogService {
    @State errors: Result[] = [];

    logError = (err: Error) => {
        this.errors = [
            ...this.errors,
            Result.error(err),
        ];
        return err;
    }
}
