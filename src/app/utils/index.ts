import { BehaviorSubject, Subject } from 'rxjs';
import * as _ from 'underscore';


export function formatTime(ms: number) {
    const minutes = '' + Math.floor(ms / 60000),
        seconds = Math.floor(ms % 60000 / 1000);

    return ''.concat(minutes, ':').concat(seconds < 10 ? '0' : '').concat('' + seconds);
}

const instances = new WeakMap();

export function current<T extends {}, O extends {}>(
    ctor: { new(...args): T },
    options?: O
): T {
    if (instances.has(ctor)) {
        return instances.get(ctor);
    }
    const inst = new ctor(options);
    instances.set(ctor, inst);

    return inst;
}

export function asyncQueue(concurrency = 1) {
    let running = 0;
    const taskQueue = [];

    const runTask = (task) => {
        const done = () => {
            running--;
            if (taskQueue.length > 0) {
                runTask(taskQueue.shift());
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

    const enqueueTask = task => taskQueue.push(task);

    return {
        push: task => running < concurrency ? runTask(task) : enqueueTask(task)
    };
}

export function assertNoErrors(...args) {
    const fillErrors: (errors: any[]) => void = _.last(args);
    const results = _.flatten(_.initial(args)) as any[];
    const errors = _.filter(results, r => r.isError);

    !_.isEmpty(errors) && fillErrors(errors);

    return errors.length > 0;
}

function asAsync<T1, T2, T3, T4, Y>(c, fn: { (a: T1, a1: T2, a2: T3, a3: T4, cb: { (err?, res?: Y): void }): void }, a: T1, a1: T2, a2: T3, a3: T4): Promise<Y>
function asAsync<T1, T2, T3, Y>(c, fn: { (a: T1, a1: T2, a2: T3, cb: { (err?, res?: Y): void }): void }, a: T1, a1: T2, a3: T3): Promise<Y>
function asAsync<T1, T2, Y>(c, fn: { (a: T1, a1: T2, cb: { (err?, res?: Y): void }): void }, a: T1, a1: T2): Promise<Y>
function asAsync<T, Y>(c, fn: { (a: T, cb: { (err?, res?: Y): void }): void }, a: T): Promise<Y>
function asAsync<Y>(c, fn: { (cb: { (err?, res?: Y): void }): void }): Promise<Y>
function asAsync(c, fn, ...args) {
    return new Promise((resolve, reject) => {
        try {
            fn.apply(c, [...args, (err?, res?) => {
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

function asAsyncOf<T1, T2, T3, T4, Y>(c, fn: { (a: T1, a1: T2, a2: T3, a3: T4, cb: { (err?, res?: Y, index?: number): boolean }): void }, a: T1, a1: T2, a2: T3, a3: T4): AsyncGenerator<Y>
function asAsyncOf<T1, T2, T3, Y>(c, fn: { (a: T1, a1: T2, a2: T3, cb: { (err?, res?: Y, index?: number): boolean }): void }, a: T1, a1: T2, a3: T3): AsyncGenerator<Y>
function asAsyncOf<T1, T2, Y>(c, fn: { (a: T1, a1: T2, cb: { (err?, res?: Y, index?: number): boolean }): void }, a: T1, a1: T2): AsyncGenerator<Y>
function asAsyncOf<T, Y>(c, fn: { (a: T, cb: { (err?, res?: Y, index?: number): boolean }): void }, a: T): AsyncGenerator<Y>
function asAsyncOf<Y>(c, fn: { (cb: { (err?, res?: Y, index?: number): boolean }): void }): AsyncGenerator<Y>
async function* asAsyncOf(context, fn, ...args) {
    let next = (result?) => { };
    let fail = (err) => { };
    let finish = {};
    const items = [];
    let started = true;
    try {
        fn.apply(context, [...args, function (err, result, index) {
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
        fail(ex);
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

export function debounce(func, wait = 0, cancelObj = 'canceled') {
    let timerId, latestResolve, shouldCancel;
    let allArgs = [];
    return function (...args) {
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

    async function invoke(args, resolve, reject) {
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
            clearTimeout(timerId);
            timerId = latestResolve = null;
        }
    }
}

export function isLoading<T extends { isLoading: boolean; }>(target: T, key, descriptor) {
    // save a reference to the original method this way we keep the values currently in the
    // descriptor and don't overwrite what another decorator might have done to the descriptor.
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    const originalMethod = descriptor.value;

    //editing the descriptor/value parameter
    descriptor.value = async function (this: T, ...args) {
        try {
            this.isLoading = true;
            return await originalMethod.apply(this, args);
        } finally {
            this.isLoading = false;
        }
    };

    // return edited descriptor as opposed to overwriting the descriptor
    return descriptor;
}

interface INotification {
    value;
    state;
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
            Object.keys(obj).forEach(key => {
                const traits = GetTraits<ISignals>(obj[key], false);
                if (!traits) {
                    return;
                }
                Notifications.attach(obj[key], obj);
                Notifications.subscribe(obj[key], obj, callback);
            });
        },
        stopObserving(obj: unknown, callback: Function) {
            Object.keys(obj).forEach(key => {
                const traits = GetTraits<ISignals>(obj[key], false);
                if (!traits) {
                    return;
                }
                Notifications.detach(obj[key], obj);
                Notifications.unsubscribe(obj[key], obj, callback);
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
        attach<T>(state: BehaviorSubject<T>, obj: unknown) {
            const { observers } = GetTraits<ISignals>(state, false);
            observers.push(obj);
        },
        detach<T>(state: BehaviorSubject<T>, obj: unknown) {
            const observers = GetTraits<ISignals>(state, false).observers.filter(o => o !== obj);
            GetTraits<ISignals>(state).observers = observers;
        },
        subscribe<T>(state: BehaviorSubject<T>, view: unknown, callback: Function) {
            const { callbacks } = GetTraits<ISignals>(state, false);
            callbacks.push([view, callback]);
        },
        unsubscribe<T>(state: BehaviorSubject<T>, view: unknown, callback: Function) {
            const callbacks = GetTraits<ISignals>(state).callbacks.filter(([a, b]) => a !== view && callback !== b);
            GetTraits<ISignals>(state, false).callbacks = callbacks;
        },
    };
})();

const objectTraits = new WeakMap<object, { [key: string]: any }>();
export const GetTraits = <T>(obj, autoCreate = true) => {
    if (autoCreate && !objectTraits.has(obj)) {
        objectTraits.set(obj, {});
    }

    return objectTraits.get(obj) as T;
}

export function State<T>(target: T, propName: string, descriptor?) {
    function initState(v?) {
        let state = new BehaviorSubject<unknown>(null);
        Notifications.declare(state, propName);

        Object.defineProperty(this, `${propName}$`, {
            get() {
                return state;
            },
            set(v) {
                if (v !== state) {
                    state = v;
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
    Object.defineProperty(target, `${propName}$`, opts);

    Binding<T>()(target, propName, descriptor);
}

export function Binding<T = any>({ didSet }: { didSet?: (this: T, view: T, val) => void } = {}) {
    return function (target: T, propName: string, descriptor?): any {
        const desc$ = Object.getOwnPropertyDescriptor(target, `${propName}$`);
        const desc = Object.getOwnPropertyDescriptor(target, propName);
        function initBinding(store$: BehaviorSubject<unknown>) {
            let state = store$;
            const didSetCb = didSet && (value => {
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
            get() {
                desc?.get();
                return this[`${propName}$`].getValue();
            },
            set(val) {
                if (this[propName] !== val) {
                    this[`${propName}$`].next(val);
                    desc?.set(val);
                }
            },
            enumerable: true,
            configurable: true
        };
        Object.defineProperty(target, propName, opts);

        return opts;
    };
}
