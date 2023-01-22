const instances = new WeakMap();

// eslint-disable-next-line @typescript-eslint/ban-types
export function inject<T extends {}>(
    ctor: { new(...args: any[]): T }, // eslint-disable-line @typescript-eslint/no-explicit-any
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
