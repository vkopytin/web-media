const instances = new WeakMap();

export function inject<T extends {}>(
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
