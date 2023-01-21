import { Subject } from 'rxjs';
import * as _ from 'underscore';

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

export function formatTime(ms: number) {
    const minutes = '' + Math.floor(ms / 60000),
        seconds = Math.floor(ms % 60000 / 1000);

    return ''.concat(minutes, ':').concat(seconds < 10 ? '0' : '').concat('' + seconds);
}

export function className(str: string, ...args: Array<{}>) {
    str = str || '';
    const classArray = str.split(/\s+/gi);
    const res = classArray.reduce((res, val) => {
        if (val.indexOf('?') !== 0) {
            return [...res, val];
        }
        if (args.shift()) {

            return [...res, val.replace(/^\?/, '')];
        }

        return res;
    }, [] as string[]);

    return res.join(' ');
}

const instances = new WeakMap();

export function current<T extends {}>(
    ctor: { new(...args: any[]): T },
    ...options: unknown[]
): T {
    if (instances.has(ctor)) {
        return instances.get(ctor);
    }
    if (ctor.length === options.length || ctor.length === 0) {
        const inst = new ctor(...options);
        instances.set(ctor, inst);
        return inst;
    }
    throw new Error(`[IoC] Conflict. Probably componenent was not initialized before. And it is not ready to be used from here.`);
}

export function asyncQueue(concurrency = 1) {
    let running = 0;
    const taskQueue = [] as Array<(a: () => void) => void>;

    const runTask = (task: (a: () => void) => void) => new Promise((resolve, reject) => {
        const done = (): void => {
            running--;
            resolve(true);
            if (taskQueue.length > 0) {
                runTask(taskQueue.shift() as (a: () => void) => void);
            }
        };
        running++;
        try {
            return task(done);
        } catch (ex) {
            reject(ex);
            _.delay(() => { throw ex; });
            return done();
        }
    });

    const enqueueTask = (task: (a: () => void) => void) => new Promise((resolve, reject) => {
        taskQueue.push(async done => {
            try {
                task(() => {
                    resolve(true);
                    done();
                });
            } catch (ex) {
                reject(ex);
            }
        });
    });

    return {
        push: (task: (a: () => void) => void) => running < concurrency ? runTask(task) : enqueueTask(task)
    };
}

export function assertNoErrors(...args: unknown[]) {
    const fillErrors = _.last(args) as (errors: unknown[]) => void;
    const results = _.flatten(_.initial(args)) as { isError: boolean }[];
    const errors = _.filter(results, r => r.isError);

    !_.isEmpty(errors) && fillErrors(errors);

    return errors.length > 0;
}

function asAsync<T1, T2, T3, T4, Y>(c: unknown, fn: { (a: T1, a1: T2, a2: T3, a3: T4, cb: { (err?: unknown, res?: Y): void }): void }, a: T1, a1: T2, a2: T3, a3: T4): Promise<Y>
function asAsync<T1, T2, T3, Y>(c: unknown, fn: { (a: T1, a1: T2, a2: T3, cb: { (err?: unknown, res?: Y): void }): void }, a: T1, a1: T2, a3: T3): Promise<Y>
function asAsync<T1, T2, Y>(c: unknown, fn: { (a: T1, a1: T2, cb: { (err?: unknown, res?: Y): void }): void }, a: T1, a1: T2): Promise<Y>
function asAsync<T, Y>(c: unknown, fn: { (a: T, cb: { (err?: unknown, res?: Y): void }): void }, a: T): Promise<Y>
function asAsync<Y>(c: unknown, fn: { (cb: { (err?: unknown, res?: Y): void }): void }): Promise<Y>
function asAsync(c: unknown, fn: Function, ...args: unknown[]) {
    return new Promise((resolve, reject) => {
        try {
            fn.apply(c, [...args, (err?: unknown, res?: unknown) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            }]);
        } catch (ex) {
            reject(ex);
        }
    });
}
export { asAsync };
export { asAsyncOf };

function asAsyncOf<T1, T2, T3, T4, Y>(c: unknown, fn: { (a: T1, a1: T2, a2: T3, a3: T4, cb: { (err?: unknown, res?: Y, index?: number): boolean }): void }, a: T1, a1: T2, a2: T3, a3: T4): AsyncGenerator<Y>
function asAsyncOf<T1, T2, T3, Y>(c: unknown, fn: { (a: T1, a1: T2, a2: T3, cb: { (err?: unknown, res?: Y, index?: number): boolean }): void }, a: T1, a1: T2, a3: T3): AsyncGenerator<Y>
function asAsyncOf<T1, T2, Y>(c: unknown, fn: { (a: T1, a1: T2, cb: { (err?: unknown, res?: Y, index?: number): boolean }): void }, a: T1, a1: T2): AsyncGenerator<Y>
function asAsyncOf<T, Y>(c: unknown, fn: { (a: T, cb: { (err?: unknown, res?: Y, index?: number): boolean }): void }, a: T): AsyncGenerator<Y>
function asAsyncOf<Y>(c: unknown, fn: { (cb: { (err?: unknown, res?: Y, index?: number): boolean }): void }): AsyncGenerator<Y>
async function* asAsyncOf(context: unknown, fn: Function, ...args: unknown[]) {
    let next = (result?: unknown) => { };
    let fail = (err: Error) => { };
    let finish = {};
    const items = [] as unknown[];
    let started = true;
    try {
        fn.apply(context, [...args, function (err: Error, result: unknown, index: number) {
            const nextArgs = [].slice.call(arguments, 0);
            if (nextArgs.length === 0) {
                started = false;
                next(finish);
                return true;
            }
            if (err) {
                fail(err);
                return true;
            }
            items.push(result);
            next(result);
        }]);
    } catch (ex) {
        fail(ex as Error);
    }
    while (true) {
        const promise = started ? new Promise((resolve, error) => {
            next = resolve;
            fail = error;
        }) : Promise.resolve(finish);
        const record = await promise;
        if (record === finish) {
            while (items.length) {
                const item = items.shift();
                yield item;
            }
            return;
        }
        while (items.length) {
            const item = items.shift();
            yield item;
        }
    }
}

export function debounce<T extends Function>(func: T, wait = 0, cancelObj = 'canceled') {
    let timerId: number | null, latestResolve: {} | null, shouldCancel: boolean;
    let allArgs = [] as unknown[][];
    return function (this: unknown, ...args: unknown[]) {
        allArgs = [...allArgs, args];
        if (!latestResolve) {
            return new Promise((resolve, reject) => {
                latestResolve = resolve;
                timerId = window.setTimeout(invoke.bind(this, allArgs, resolve, reject), wait);
            });
        }

        shouldCancel = true;
        return new Promise((resolve, reject) => {
            latestResolve = resolve;
            timerId = window.setTimeout(invoke.bind(this, allArgs, resolve, reject), wait);
        });
    }

    async function invoke(this: unknown, args: unknown[][], resolve: (a: unknown) => void, reject: (a: unknown) => void) {
        if (shouldCancel && resolve !== latestResolve) {
            resolve(cancelObj)
        } else {
            allArgs = [] as unknown[][];
            try {
                const res = await func.apply(this, [...(args[args.length - 1] || []), ...args.slice(0, -1)]);
                resolve(res);
            } catch (ex) {
                reject(ex);
            }
            shouldCancel = false;
            clearTimeout(timerId as number);
            timerId = latestResolve = null;
        }
    }
}

type ArgumentTypes<T> = T extends (...args: infer U) => infer R ? U : never;
type ReplaceReturnType<T, TNewReturn> = (...a: ArgumentTypes<T>) => TNewReturn;

export const asyncDebounce = <F extends (...args: any) => any>(fn: F, timeout: number): ReplaceReturnType<F, Promise<ReturnType<F>>> => {
    let subscribers: Array<[(arg: ReturnType<F>) => void, (arg: unknown) => void]> = [];
    const dfn = debounce(async (...args: unknown[]) => {
        try {
            const res = await fn(...args);
            const oldSubscribers = [...subscribers];
            subscribers = [];
            oldSubscribers.forEach(([resolve]) => resolve(res));
        } catch (ex) {
            const oldSubscribers = [...subscribers];
            subscribers = [];
            oldSubscribers.forEach(([, reject]) => reject(ex));
        }
    }, timeout);

    return ((...args: []) => new Promise((resolve, reject) => {
        subscribers.push([resolve, reject]);
        setTimeout(() => dfn(...args));
    }));
}

export function isLoading<T extends { isLoading: boolean; }>(target: T, key: string, descriptor?: PropertyDescriptor) {
    // save a reference to the original method this way we keep the values currently in the
    // descriptor and don't overwrite what another decorator might have done to the descriptor.
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    const originalMethod = descriptor?.value;

    //editing the descriptor/value parameter
    const value = async function (this: T, ...args: unknown[]) {
        try {
            this.isLoading = true;
            return await originalMethod.apply(this, args);
        } finally {
            this.isLoading = false;
        }
    };

    // return edited descriptor as opposed to overwriting the descriptor
    return {
        ...descriptor,
        value,
    };
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
    const notifications$ = new Subject<INotification>();
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
        notifications$,
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
                trait.observers.forEach(obj => obj === o && cb.call(obj, value.value));
            });
        },
        declare<T>(state: DynamicProperty<T>, propName: string) {
            assert.instanceOf(state, DynamicProperty, `Wrong parameter ${state}. Should be of ${DynamicProperty.name}`);
            GetTraits<IBindingInfo>(state, {
                callbacks: [],
                observers: [],
                propName
            });
            state.subscribe(value => {
                Notifications.next({
                    state,
                    value,
                });
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
            callbacks.push([view, callback]);
        },
        unsubscribe(state: {}, view: unknown, callback: Function) {
            assert.instanceOf(state, DynamicProperty, `Wrong parameter ${state}. Should be of ${DynamicProperty.name}`);
            const callbacks = GetTraits<IBindingInfo>(state).callbacks.filter(([a, b]) => a !== view && callback !== b);
            GetTraits<IBindingInfo>(state, false).callbacks = callbacks;
        },
    };
})();

class DynamicProperty<T> {
    private subscribers: Array<(v: T) => void> = [];

    constructor(public value: T, public get = () => this.value, public set = (val: T) => this.value = val) {

    }

    getValue() {
        return this.get();
    }

    subscribe(a: (v: unknown) => void) {
        this.subscribers.push(a);
    }

    next(v: T) {
        this.set(v);
        this.subscribers.forEach(s => {
            try {
                s(v);
            } catch (ex) {
                console.error('Unexpected error', ex);
            }
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
        get: initState,
        set: initState,
        enumerable: true,
        configurable: true
    };

    Object.defineProperty(target, propName, opts);
}

export function Binding<T, R>(path: (a: T) => R, bindableProperty: keyof R, options?: { didSet?: <V>(a: T, v: V) => void }) {
    return function (target: T, propName: string, descriptor?: PropertyDescriptor): any {
        Notifications.declareBindingMetadata(target, propName);
        function initBinding(this: T, v?: DynamicProperty<unknown>) {
            const obj = path(this);
            const propInfo: IPropertyInfo<unknown> = Notifications.GetTraits(obj as {});
            const state = propInfo[`${String(bindableProperty)}`];

            const traits: IPropertyInfo<unknown> = Notifications.hasTraits(this) ? Notifications.GetTraits(this as {})
                : Notifications.GetTraits(this as {}, {});
            if (traits[propName] && traits[propName] !== state) {
                throw new Error(`The binding is alreayd defined on the object with property ${propName}`);
            }

            const didSetCb = options?.didSet && ((value: T[keyof T]) => {
                options?.didSet?.call(this, this, value);
            });
            didSetCb && Notifications.subscribe(state, this, didSetCb);

            traits[propName] = state;
            Object.defineProperty(this, propName, {
                get() {
                    return state.get();
                },
                set(v) {
                    const value = state.get();
                    if (value !== v) {
                        state.next(v);
                    }
                },
                enumerable: true,
                configurable: true
            });

            return state.get();
        }

        const storeOpts = {
            get: initBinding,
            set: initBinding,
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
