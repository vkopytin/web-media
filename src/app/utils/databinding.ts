/* eslint-disable */

const assert = {
    instanceOf(instance: unknown, assetType: Function, message: string) {
        if (instance instanceof assetType) {
            return true;
        }
        const error = new Error(message);
        console.error(error)
        throw error;
    }
}

interface INotification {
    value: unknown;
    state: {};
}

interface IBindingInfo {
    propName: string;
    callbacks: Array<[unknown, Function]>;
    observers: Array<unknown>;
}

interface IPropertyInfo<T> {
    [key: string]: DynamicProperty<T>;
}

interface IBindingMetadataInfo {
    declaredBindings: string[]
}

export const Notifications = (function () {
    const objectTraits = new WeakMap<object, object>();
    const GetTraits = <T extends {}>(obj: {}, autoCreate?: {}): T => {
        if (autoCreate && !objectTraits.has(obj)) {
            objectTraits.set(obj, autoCreate);
        } else if (autoCreate && objectTraits.has(obj)) {
            throw new Error(`Can't declare dynamic property which is already created`);
        }

        return objectTraits.get(obj) as T;
    };

    return {
        hasTraits(obj: unknown) {
            return objectTraits.has(obj as object);
        },
        GetTraits,
        declareBindingMetadata(target: unknown, propName: string) {
            const bindingDeclarations: IBindingMetadataInfo = Notifications.hasTraits(target) ? Notifications.GetTraits(target as {})
                : Notifications.GetTraits(target as {}, {});
            bindingDeclarations.declaredBindings = bindingDeclarations.declaredBindings || [];
            bindingDeclarations.declaredBindings.push(propName);
        },
        initBindingMetadata(dict: { [key: string]: any }) {
            const bindingDeclarations: IBindingMetadataInfo = GetTraits(dict.constructor.prototype);
            if (!bindingDeclarations) {
                return;
            }
            bindingDeclarations.declaredBindings.forEach((p: string) => {
                dict[p];
            });
        },
        observe(obj: unknown, callback: Function) {
            const dict = obj as { [key: string]: {} };
            Notifications.initBindingMetadata(dict);
            const objTraits = GetTraits<IPropertyInfo<unknown>>(dict);
            Object.keys(objTraits).forEach(key => {
                const traits = GetTraits<IBindingInfo>(objTraits[key]);
                if (!traits) {
                    return;
                }
                Notifications.attach(objTraits[key], obj);
                Notifications.subscribe(objTraits[key], obj, callback);
            });
        },
        stopObserving(obj: unknown, callback: Function) {
            const dict = obj as { [key: string]: {} };
            const objTraits = GetTraits<IPropertyInfo<unknown>>(dict);
            Object.keys(objTraits).forEach(key => {
                const traits = GetTraits<IBindingInfo>(objTraits[key]);
                if (!traits) {
                    return;
                }
                Notifications.detach(objTraits[key], obj);
                Notifications.unsubscribe(objTraits[key], obj, callback);
            });
        },
        next(value: INotification) {
            const trait = GetTraits<IBindingInfo>(value.state);
            trait.callbacks.forEach(([o, cb]) => {
                trait.observers.forEach(obj => cb.call(obj, value.value));
            });
        },
        declare<T>(state: DynamicProperty<T>, propName: string) {
            assert.instanceOf(state, DynamicProperty, `Wrong parameter ${state}. Should be of ${DynamicProperty.name}`);
            GetTraits<IBindingInfo>(state, {
                callbacks: [],
                observers: [],
                propName
            });
        },
        attach(state: {}, obj: unknown) {
            assert.instanceOf(state, DynamicProperty, `Wrong parameter ${state}. Should be of ${DynamicProperty.name}`);
            const { observers } = GetTraits<IBindingInfo>(state);
            observers.push(obj);
        },
        detach(state: {}, obj: unknown) {
            assert.instanceOf(state, DynamicProperty, `Wrong parameter ${state}. Should be of ${DynamicProperty.name}`);
            const observers = GetTraits<IBindingInfo>(state).observers.filter(o => o !== obj);
            GetTraits<IBindingInfo>(state).observers = observers;
        },
        subscribe(state: {}, view: unknown, callback: Function) {
            assert.instanceOf(state, DynamicProperty, `Wrong parameter ${state}. Should be of ${DynamicProperty.name}`);
            const { callbacks } = GetTraits<IBindingInfo>(state);
            callbacks.push([null, callback]);
        },
        unsubscribe(state: {}, view: unknown, callback: Function) {
            assert.instanceOf(state, DynamicProperty, `Wrong parameter ${state}. Should be of ${DynamicProperty.name}`);
            const callbacks = GetTraits<IBindingInfo>(state).callbacks.filter(([a, b]) => callback !== b);
            GetTraits<IBindingInfo>(state, false).callbacks = callbacks;
        },
    };
})();

class DynamicProperty<T> {
    constructor(
        public value: T,
        public get = () => this.value,
        public set = (val: T) => this.value = val
    ) { }

    getValue() {
        return this.get();
    }

    next(v: T) {
        this.set(v);
        Notifications.next({
            state: this,
            value: v,
        });
    }
}

export function State<T>(target: T, propName: string, descriptor?: PropertyDescriptor) {
    function initState(this: T, v?: T[keyof T]) {
        const state = new DynamicProperty(v as unknown);
        Notifications.declare(state, propName);
        const traits: IPropertyInfo<unknown> = Notifications.hasTraits(this) ? Notifications.GetTraits(this as {})
            : Notifications.GetTraits(this as {}, {});
        traits[propName] = state;

        Object.defineProperty(this, propName, {
            get() {
                const traits: IPropertyInfo<unknown> = Notifications.GetTraits(this);
                return traits[propName].get();
            },
            set(v) {
                const traits: IPropertyInfo<unknown> = Notifications.GetTraits(this);
                const value = traits[propName].get();
                if (value !== v) {
                    traits[propName].next(v);
                }
            },
            enumerable: true,
            configurable: true
        });

        return state;
    }

    const opts = {
        get: function (this: T) { return initState.call(this).get(); },
        set: function (this: T, v: unknown) { initState.call(this).next(v); },
        enumerable: true,
        configurable: true
    };

    Object.defineProperty(target, propName, opts);
}

export function Binding<T, R>(path: (a: T) => R, bindableProperty: keyof R, options?: { didSet?: <V>(a: T, v: V) => void }) {
    return function (target: T, propName: string, descriptor?: PropertyDescriptor): any {
        Notifications.declareBindingMetadata(target, propName);
        function initBinding(this: T, v?: unknown): DynamicProperty<unknown> {
            const obj = path(this);
            const propInfo: IPropertyInfo<unknown> = Notifications.GetTraits(obj as {});
            if (!propInfo[`${String(bindableProperty)}`]) {
                Notifications.initBindingMetadata(obj as {});
            }
            const state = propInfo[String(bindableProperty)];

            const traits: IPropertyInfo<unknown> = Notifications.hasTraits(this) ? Notifications.GetTraits(this as {})
                : Notifications.GetTraits(this as {}, {});
            if (traits[propName] && traits[propName] !== state) {
                throw new Error(`The binding is alreayd defined on the object with property ${propName}`);
            }
            traits[propName] = state;

            const didSetCb = options?.didSet && ((value: T[keyof T]) => {
                options?.didSet?.call(this, this, value);
            });
            didSetCb && Notifications.subscribe(state, this, didSetCb);
            Notifications.attach(state, obj);

            Object.defineProperty(this, propName, {
                get() {
                    const traits: IPropertyInfo<unknown> = Notifications.GetTraits(this);
                    return traits[propName].get();
                },
                set(v) {
                    const traits: IPropertyInfo<unknown> = Notifications.GetTraits(this);
                    const value = traits[propName].get();
                    if (value !== v) {
                        traits[propName].next(v);
                    }
                },
                enumerable: true,
                configurable: true
            });

            return state;
        }

        const storeOpts = {
            get: function (this: T) { return initBinding.call(this).get(); },
            set: function (this: T, v: unknown) { initBinding.call(this).next(v); },
            enumerable: true,
            configurable: true,
        };
        Object.defineProperty(target, propName, storeOpts);
    };

}

/**
 * fisrt attemt.
 * It is clear from where data comes. But it is unclear that somePropery$ will be declared after @State decorator
 * supports databinding in this way e.g.
 * ```js
// in a ViewModel
class ViewModel {
    // declare state and property
    someProperty$: DynamicProperty<number>;
    \@StateV2 someProperty = 0;
}
```
 * in a View
 * ```
class View {
    // reuse ViewModel state and property
    someProperty$ = current(ViewModel).someProperty$
    \@BindingV2() someProperty = 0;
    // subscribe to data changes. e.g.
    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }
    // and unsubscribe
    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }
}
```
*/
export function StateV2<T>(target: T, propName: string, descriptor?: PropertyDescriptor) {
    function initState(this: T, v?: T[keyof T]) {
        let state = new DynamicProperty<unknown>(v);
        Notifications.declare(state, propName);

        Object.defineProperty(this, `${propName}$`, {
            get() {
                return state;
            },
            set(v) {
                throw new Error(`State can't change once declared.`)
            },
            enumerable: true,
            configurable: true
        });

        return state;
    }

    const opts = {
        get: initState,
        set: initState,
        enumerable: true,
        configurable: true
    };
    Object.defineProperty(target, `${propName}$`, opts);

    return BindingV2<T>()(target, propName, descriptor);
}

export function BindingV2<T>({ didSet }: { didSet?: (this: T, view: T, val: any) => void } = {}) {
    return function (target: T, propName: string, descriptor?: PropertyDescriptor): any {
        const desc$ = Object.getOwnPropertyDescriptor(target, `${String(propName)}$`);
        function initBinding(this: T, store$: DynamicProperty<unknown>) {
            let state = store$;
            const didSetCb = didSet && ((value: T[keyof T]) => {
                didSet.call(this, this, value);
            });
            didSetCb && Notifications.subscribe(state, this, didSetCb);
            Object.defineProperty(this, `${propName}$`, {
                get() {
                    return state;
                },
                set(v$) {
                    if (!(v$ instanceof DynamicProperty)) {
                        throw new Error('Please, provide BehaviorSubject');
                    }
                    if (v$ !== state) {
                        didSetCb && Notifications.unsubscribe(state, this, didSetCb);
                        state = v$;
                        didSetCb && Notifications.subscribe(state, this, didSetCb);
                    }
                },
                enumerable: true,
                configurable: true
            });

            return store$;
        }

        const storeOpts = {
            get() {
                throw new Error('There is no assigned subscriber to the binding property');
            },
            set: initBinding,
            enumerable: true,
            configurable: true,
            ...desc$
        };
        Object.defineProperty(target, `${propName}$`, storeOpts);

        const opts = {
            get(this: T): T[keyof T] {
                if (descriptor?.get) {
                    return descriptor?.get?.();
                }
                const val = (this[`${propName}$` as keyof T] as DynamicProperty<unknown>).getValue() as any;

                return val;
            },
            set(this: T, val: T[keyof T]) {
                descriptor?.set?.(val);
                if (this[propName as keyof T] !== val) {
                    (this[`${propName}$` as keyof T] as DynamicProperty<unknown>).next(val);
                }
            },
            enumerable: true,
            configurable: true
        };
        Object.defineProperty(target, propName, opts);

        return opts;
    }
}
