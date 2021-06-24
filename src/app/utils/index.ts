import * as _ from 'underscore';
import { utils } from 'databindjs';
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';


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
export { asAsyncOf };

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

export function State<T, Y extends keyof T>(target: T, propName: Y) {
    function ensureStore(v?) {
        let store$ = new BehaviorSubject(v);
        
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
        get: ensureStore,
        set: ensureStore,
        enumerable: true,
        configurable: true
    };
    Object.defineProperty(target, `${propName}$`, opts);

    Binding(target, propName);
}

export function Binding<T, Y extends keyof T>(target: T, propName: Y) {
    const desc = Object.getOwnPropertyDescriptor(target, `${propName}$`);
    function ensureStore(v) {
        let store$ = v;
        const assignedSubjects = [] as [any, Subscription, Subscription][];
        Object.defineProperty(this, `${propName}$`, {
            get() {
                return store$;
            },
            set(v$) {
                if (!(v$ instanceof BehaviorSubject)) {
                    throw new Error('Please, provide BehaviorSubject');
                }
                if (v$ !== store$) {
                    let current = assignedSubjects.find(([a]) => a === v$);
                    if (current) {
                        current[1].unsubscribe();
                        current[2].unsubscribe();
                    }

                    current = [
                        v$,
                        store$.pipe(distinctUntilChanged()).subscribe(v$),
                        v$.pipe(distinctUntilChanged()).subscribe(store$)
                    ];
                    assignedSubjects.push(current);
                }
            },
            enumerable: true,
            configurable: true
        });

        return store$;
    }

    if (!desc) {
        const opts = {
            get() {
                throw new Error('There is no assigned subscriber to the binding property');
            },
            set: ensureStore,
            enumerable: true,
            configurable: true
        };
        Object.defineProperty(target, `${propName}$`, opts);
    }

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
}
