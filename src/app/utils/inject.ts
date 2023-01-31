const instances = new WeakMap();

export function inject<T, A, B, C, D, E, F, G>(ctor: { new(a: A, b: B, c: C, d: D, e: E, f: F, g: G): T }, a?: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G): T;
export function inject<T, A, B, C, D, E, F>(ctor: { new(a: A, b: B, c: C, d: D, e: E, f: F): T }, a?: A, b?: B, c?: C, d?: D, e?: E, f?: F): T;
export function inject<T, A, B, C, D, E>(ctor: { new(a: A, b: B, c: C, d: D, e: E): T }, a?: A, b?: B, c?: C, d?: D, e?: E): T;
export function inject<T, A, B, C, D>(ctor: { new(a: A, b: B, c: C, d: D): T }, a?: A, b?: B, c?: C, d?: D): T;
export function inject<T, A, B, C>(ctor: { new(a: A, b: B, c: C): T }, a?: A, b?: B, c?: C): T;
export function inject<T, A, B>(ctor: { new(a: A, b: B): T }, a?: A, b?: B): T;
export function inject<T, A>(ctor: { new(a: A): T }, a?: A): T;
export function inject<T>(ctor: { new(): T }): T;
// eslint-disable-next-line @typescript-eslint/ban-types
export function inject<T>(
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
    throw new Error(`[IoC] Conflict. Probably '${ctor.name}' componenent was not initialized before. And it is not ready to be used from here.`);
}
