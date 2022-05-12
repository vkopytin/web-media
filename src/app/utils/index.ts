import { Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as _ from 'underscore';


export function formatTime(ms: number) {
    const minutes = '' + Math.floor(ms / 60000),
        seconds = Math.floor(ms % 60000 / 1000);

    return ''.concat(minutes, ':').concat(seconds < 10 ? '0' : '').concat('' + seconds);
}

const instances = new WeakMap();

export function current<T extends {}, O extends {}>(
    ctor: { new (...args): T },
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
function asAsync<T1, T2, Y>(c, fn: { (a: T1, a1: T2, cb: {(err?, res?: Y): void}): void}, a: T1, a1: T2): Promise<Y>
function asAsync<T, Y>(c, fn: { (a: T, cb: { (err?, res?: Y): void }): void }, a: T): Promise<Y>
function asAsync<Y>(c, fn: { (cb: {(err?, res?: Y): void}): void}): Promise<Y>
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
function asAsyncOf<T1, T2, Y>(c, fn: { (a: T1, a1: T2, cb: {(err?, res?: Y, index?: number): boolean}): void}, a: T1, a1: T2): AsyncGenerator<Y>
function asAsyncOf<T, Y>(c, fn: { (a: T, cb: { (err?, res?: Y, index?: number): boolean }): void }, a: T): AsyncGenerator<Y>
function asAsyncOf<Y>(c, fn: { (cb: {(err?, res?: Y, index?: number): boolean}): void}): AsyncGenerator<Y>
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

export const Notify = (function () {
    const mainLoop$ = new Subject<{
        inst;
        value;
    }>();

    const impl = {
        lock: asyncQueue(),
        listeners: [] as [(...args) => void, ValueContainer<any, any>, any, any][],
        subscribe<T>(callback, inst: ValueContainer<any, any>, context) {
            //callback = false;
            if (callback) {
                let listener = this.listeners.find(([cb, cx]) => cb === callback && cx === inst);
                if (listener) {
                    return;
                }
                listener = [callback, inst, (args) => {
                    if (inst !== args.inst) {
                        return;
                    }
                    try {
                        callback.call(context, args);
                    } catch (ex) {
                        console.error(ex);
                    }
                }];
                this.listeners.push(listener);
                listener[3] = mainLoop$.subscribe(listener[2]);
            }

            inst.listeners.forEach(fn => {
                const listener2 = [fn, inst, (args) => {
                    if (inst !== args.inst) {
                        return;
                    }
                    try {
                        fn.call(context, context, args.value);
                    } catch (ex) {
                        console.error(ex);
                    }
                }];
                this.listeners.push(listener2);
                listener2[3] = mainLoop$.subscribe(listener2[2]);
            });
        },
        unsubscribe<T>(callback, inst: ValueContainer<any, any>) {
            //callback = false;
            if (callback) {
                const listener = this.listeners.find(([cb, cx]) => cb === callback && cx === inst);
                if (!listener) {
                    return;
                }
                listener[3].unsubscribe();
                const index = this.listeners.indexOf(listener);
                this.listeners.splice(index, 1);
            }

            inst.listeners.forEach(fn => {
                const listener = this.listeners.find(([cb, cx]) => cb === fn && cx === inst);
                if (!listener) {
                    return;
                }
                listener[3].unsubscribe();
                const index = this.listeners.indexOf(listener);
                this.listeners.splice(index, 1);
            });
        },
        subscribeChildren<T, Y>(listener, inst) {
            const props = Object.keys(inst).reduce((res, key) => inst[key] instanceof ValueContainer
                ? [...res, inst[key] as ValueContainer<T, Y>]
                : res, [] as ValueContainer<T, Y>[]);

            props.forEach(e => e.subscribe(listener, inst));
        },
        unsubscribeChildren<T, Y>(listener, inst) {
            const props = Object.keys(inst).reduce((res, key) => inst[key] instanceof ValueContainer
                ? [...res, inst[key] as ValueContainer<T, Y>]
                : res, [] as ValueContainer<T, Y>[]);

            props.forEach(e => e.unsubscribe(listener, inst));
        },
        trigger({ inst, value }) {
            this.lock.push(done => {
                try {
                    mainLoop$.next({ inst, value });
                } finally {
                    done();
                }
            });
        }
    };

    return impl;
})();

class ValueContainer<T, Y> {
    listeners = [];
    trace = '';

    constructor(public value: T, public target: Y, public propName) {
        this.trace = new Error().stack;
    }

    subscribe(handler, ctx) {
        Notify.subscribe(handler, this, ctx);
    }

    unsubscribe(handler, ctx) {
        Notify.unsubscribe(handler, this);
    }

    next(val: T) {
        if (this.value !== val) {
            this.value = val;
            Notify.trigger({
                inst: this,
                value: val
            });
        }
    }

    map<U>(fn: (v: T) => U): ValueContainer<U, Y> {
        return ValueContainer.from(this.cat(fn), this.target, fn);
    }

    cat<Y>(fn: (v: T) => Y): Y {
        return fn(this.value);
    }

    pipe(...args) {
        return this;
    }

    getValue(): T {
        return this.value;
    }

    static from<T, Y>(val: T | ValueContainer<T, Y>, target: Y, propName) {
        if (val instanceof ValueContainer) {
            return val;
        }

        return new ValueContainer<T, Y>(val, target, propName);
    }
}

export function State<T, Y extends keyof T>(target: T, propName: Y, descriptor?) {
    function initState(v?) {
        let store$ = ValueContainer.from(v, target, propName);

        Object.defineProperty(this, `${propName}$`, {
            get() {
                return store$;
            },
            set(v) {
                if (v !== store$) {
                    store$ = v;
                }
            },
            enumerable: true,
            configurable: true
        });

        return store$;
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
    return function <Y extends keyof T>(target: T, propName: Y, descriptor?): any {
        const desc = Object.getOwnPropertyDescriptor(target, `${propName}$`);

        function initBinding(store$: ValueContainer<T[Y], T>) {
            store$.listeners.push(() => didSet.call(this, this));
            Object.defineProperty(this, `${propName}$`, {
                get() {
                    return store$;
                },
                set(v$) {
                    if (!(v$ instanceof ValueContainer)) {
                        throw new Error('Please, provide ValueContainer');
                    }
                    if (v$ !== store$) {
                        store$ = v$;
                        store$.listeners.push(didSet);
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
            ...desc
        };
        Object.defineProperty(target, `${propName}$`, storeOpts);

        const opts = {
            get() {
                return this[`${propName}$`].getValue();
            },
            set(val) {
                if (this[propName] !== val) {
                    this[`${propName}$`].next(val);
                }
            },
            enumerable: true,
            configurable: true
        };
        Object.defineProperty(target, propName, opts);

        return opts;
    };
}
