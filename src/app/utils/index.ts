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
