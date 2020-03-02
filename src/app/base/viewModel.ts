import { Events } from 'databindjs';
import { ServiceResult } from './serviceResult';


class ViewModel extends Events {
    settings = {
        errors: [] as ServiceResult<any, Error>[]
    };

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }
}

export { ViewModel };
