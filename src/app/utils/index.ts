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
