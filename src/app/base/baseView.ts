import * as React from 'react';
import { ServiceResult } from './serviceResult';
import { Events, withEvents, Constructor } from 'databindjs';


const withEvents2: <TBase extends Constructor<{}>>(Base: TBase) => {
    new(...args: any[]): Events
    prototype: Events
} & TBase = withEvents;
    
class BaseView<P = {}, S = {}, SS = any> extends withEvents2(React.Component)<P, S, SS> {

    prop<K extends keyof S>(propName: K, val?: S[K]): S[K] {
        if (arguments.length > 1 && val !== (this.state as any)[propName]) {
            (this.state as any)[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    errors2(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== (this.prop as any)('errors')) {
            (this as any).prop('errors', [...(this as any).prop('errors'), ...val]);
            this.showErrors(val);
        }

        return (this.prop as any)('errors');
    }

    showErrors(...args) {

    }
}

export { BaseView };
