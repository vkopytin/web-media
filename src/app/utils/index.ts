import { BehaviorSubject, Subject } from 'rxjs';
import * as _ from 'underscore';


export function formatTime(ms: number) {
    const minutes = '' + Math.floor(ms / 60000),
        seconds = Math.floor(ms % 60000 / 1000);

    return ''.concat(minutes, ':').concat(seconds < 10 ? '0' : '').concat('' + seconds);
}

const instances = new WeakMap();

export function current<T extends {}>(
    ctor: { new(...args: any[]): T },
    ...options: unknown[]
): T {
    if (instances.has(ctor)) {
        return instances.get(ctor);
    }
    if (ctor.length === options.length) {
        const inst = new ctor(...options);
        instances.set(ctor, inst);
        return inst;
    }

    throw new Error('[IoC] Conflict. Probably compnenent was not initialized before. And it is not ready to be used from here.');
}

export function asyncQueue(concurrency = 1) {
    let running = 0;
    const taskQueue = [] as Array<(a: () => void) => void>;

    const runTask = (task: (a: () => void) => void) => {
        const done = () => {
            running--;
            if (taskQueue.length > 0) {
                runTask(taskQueue.shift() as (a: () => void) => void);
            }
        };
        running++;
        try {
            task(done);
        } catch (ex) {
            _.delay(() => { throw ex; });
            done();
        }
    };

    const enqueueTask = (task: (a: () => void) => void) => taskQueue.push(task);

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
    let allArgs = [] as unknown[];
    return function (this: unknown, ...args: unknown[]) {
        allArgs = [...allArgs, ...args];
        if (!latestResolve) {
            return new Promise((resolve, reject) => {
                latestResolve = resolve;
                timerId = setTimeout(invoke.bind(this, allArgs, resolve, reject), wait);
            });
        }

        shouldCancel = true;
        return new Promise((resolve, reject) => {
            latestResolve = resolve;
            timerId = setTimeout(invoke.bind(this, allArgs, resolve, reject), wait);
        });
    }

    async function invoke(this: unknown, args: unknown[], resolve: (a: unknown) => void, reject: (a: unknown) => void) {
        if (shouldCancel && resolve !== latestResolve) {
            resolve(cancelObj)
        } else {
            allArgs = [];
            try {
                const res = await func.apply(this, args);
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

interface ISignals {
    propName: string;
    callbacks: Array<[unknown, Function]>;
    observers: Array<unknown>;
}

export const Notifications = (function () {
    const state = new Subject<INotification>();

    return {
        state,
        observe(obj: unknown, callback: Function) {
            const dict = obj as { [key: string]: {} };
            Object.keys(dict).forEach(key => {
                const traits = GetTraits<ISignals>(dict[key], false);
                if (!traits) {
                    return;
                }
                Notifications.attach(dict[key], obj);
                Notifications.subscribe(dict[key], obj, callback);
            });
        },
        stopObserving(obj: unknown, callback: Function) {
            const dict = obj as { [key: string]: {} };
            Object.keys(dict).forEach(key => {
                const traits = GetTraits<ISignals>(dict[key], false);
                if (!traits) {
                    return;
                }
                Notifications.detach(dict[key], obj);
                Notifications.unsubscribe(dict[key], obj, callback);
            });
        },
        next(value: INotification) {
            const trait = GetTraits<ISignals>(value.state, false);
            trait.callbacks.forEach(([o, cb]) => {
                trait.observers.forEach(obj => obj === o && cb.call(obj, value.value));
            });
        },
        declare<T>(state: BehaviorSubject<T>, propName: string) {
            const traits = GetTraits<ISignals>(state);
            traits.callbacks = [];
            traits.observers = [];
            traits.propName = propName;
            state.subscribe(value => {
                Notifications.next({
                    state,
                    value,
                });
            });
        },
        attach(state: {}, obj: unknown) {
            const { observers } = GetTraits<ISignals>(state, false);
            observers.push(obj);
        },
        detach(state: {}, obj: unknown) {
            const observers = GetTraits<ISignals>(state, false).observers.filter(o => o !== obj);
            GetTraits<ISignals>(state).observers = observers;
        },
        subscribe(state: {}, view: unknown, callback: Function) {
            const { callbacks } = GetTraits<ISignals>(state, false);
            callbacks.push([view, callback]);
        },
        unsubscribe(state: {}, view: unknown, callback: Function) {
            const callbacks = GetTraits<ISignals>(state).callbacks.filter(([a, b]) => a !== view && callback !== b);
            GetTraits<ISignals>(state, false).callbacks = callbacks;
        },
    };
})();

const objectTraits = new WeakMap<object, object>();
export const GetTraits = <T extends {}>(obj: {}, autoCreate = true) => {
    if (autoCreate && !objectTraits.has(obj)) {
        objectTraits.set(obj, {});
    }

    return objectTraits.get(obj) as T;
}

export function State<T>(target: T, propName: string, descriptor?: PropertyDescriptor) {
    function initState(this: T, v?: T[keyof T]) {
        let state = new BehaviorSubject<T[keyof T] | null>(null);
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

    return Binding<T>()(target, propName, descriptor);
}

export function Binding<T>({ didSet }: { didSet?: (this: T, view: T, val: T[keyof T]) => void } = {}) {
    return function (target: T, propName: string, descriptor?: PropertyDescriptor): any {
        const desc$ = Object.getOwnPropertyDescriptor(target, `${String(propName)}$`);
        function initBinding(this: T, store$: BehaviorSubject<unknown>) {
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
                    if (!(v$ instanceof BehaviorSubject)) {
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
                const val = (this[`${propName}$` as keyof T] as BehaviorSubject<unknown>).getValue() as any;
                descriptor?.get?.();
                return val;
            },
            set(this: T, val: T[keyof T]) {
                if (this[propName as keyof T] !== val) {
                    (this[`${propName}$` as keyof T] as BehaviorSubject<unknown>).next(val);
                    descriptor?.set?.(val);
                }
            },
            enumerable: true,
            configurable: true
        };
        Object.defineProperty(target, propName, opts);

        return opts;
    };
}
