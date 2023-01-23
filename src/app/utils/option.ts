class Monad<T> {
    // pure :: a -> M a
    pure<R>(f: R): Monad<R> { throw 'pure method needs to be implemented' } // eslint-disable-line @typescript-eslint/no-unused-vars
    pureNotEmpty<R>(f: R) { throw 'pure method needs to be implemented' } // eslint-disable-line @typescript-eslint/no-unused-vars

    // flatMap :: # M a -> (a -> M b) -> M b
    flatMap<R>(x: (a: T) => Monad<R>): Monad<R> { throw 'flatMap method needs to be implemented' } // eslint-disable-line @typescript-eslint/no-unused-vars

    // map :: # M a -> (a -> b) -> M b
    map = <R>(f: (t: T) => R): Monad<R> => this.flatMap<R>(x => this.pure(f(x)))
}

export class Option<T> extends Monad<T> {
    value!: T;
    map!: <R>(f: (t: T) => R) => Option<R>;
    // pure :: a -> Option a
    static pure = <T>(value: T) => {
        return new Some(value)
    }

    static pureNotEmpty = <T>(value: T) => {
        if ((value === null) || (value === undefined)) {
            return none;
        }
        return new Some(value)
    }

    static some<T>(value: T) {
        return new Some(value);
    }

    static none<T>() {
        return none as Option<T>;
    }

    pure: <T>(value: T) => Option<T> = Option.pure;

    // flatMap :: # Option a -> (a -> Option b) -> Option b
    flatMap = <R>(f: (a: T) => Option<R>): Option<R> =>
        this.constructor.name === 'None' ? none as Option<R>
            : f(this.value)

    // equals :: # M a -> M a -> boolean
    equals = (x: Option<T>) => this.toString() === x.toString()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    match<R>(success: (a: T) => R, empty: () => R): R {
        throw new Error('not implemented');
    }

    tap(f: (v: T) => void): Option<T> {
        this.match(
            v => f(v)
            ,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => { }
        );

        return this;
    }

    orElse<R>(f: () => R): Option<R> {
        return this.match(
            () => Option.none()
            ,
            () => Option.some(f())
        )
    }

    async await<T>(this: Option<Promise<Option<T>>>): Promise<Option<T>> {
        const res = await this.match<Promise<Option<T>>>(async a => {
            const res = await a;
            return res;
        }, () => Promise.resolve(Option.none()));

        return res;
    }
}

export class None<T, E = Error> extends Option<T> {
    static error<T, E = Error>(error: E) {
        return new None(error) as Option<T>;
    }

    constructor(public error: E) {
        super()
    }

    toString() {
        return 'None';
    }

    match<R>(success: (a: T) => R, empty: () => R): R {
        return empty();
    }
}

// Cached None class value
export const none = new None(new Error('Unknown error'))
Option.pure = none.pure

export class Some<T> extends Option<T> {
    static pure: <T>(t: T) => Option<T>;
    constructor(public value: T) {
        super();
        this.value = value;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    match<R>(success: (a: T) => R, empty: () => R): R {
        return success(this.value);
    }

    toString() {
        return `Some(${this.value})`
    }
}
