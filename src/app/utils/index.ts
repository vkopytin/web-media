import * as _ from 'underscore';
export * from './databinding';

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
