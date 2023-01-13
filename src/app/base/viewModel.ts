import { Events } from 'databindjs';
import { ServiceResult } from './serviceResult';


export interface IDefaultViewModelProps {
    errors?: ServiceResult<any, Error>[];
}

class ViewModel<S extends IDefaultViewModelProps = IDefaultViewModelProps> extends Events {
    settings = { errors: [] } as unknown as S;

    prop<K extends keyof S>(propName: K, val?: S[K]): S[K] {
        if (arguments.length > 1 && val !== (this.settings as any)[propName]) {
            (this.settings as any)[propName] = val;
            this.trigger(`change:prop(${String(propName)})`);
        }

        return this.settings[propName];
    }

    errors2(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }
}

export { ViewModel };
