class Monad<T> {
    // pure :: a -> M a
    pure<R>(f: R): Monad<R> { throw 'pure method needs to be implemented' }
    pureNotEmpty<R>(f: R) { throw 'pure method needs to be implemented' }

    // flatMap :: # M a -> (a -> M b) -> M b
    flatMap<R>(x: (a: T) => Monad<R>): Monad<R> { throw 'flatMap method needs to be implemented' }

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

    pure: any = Option.pure;

    // flatMap :: # Option a -> (a -> Option b) -> Option b
    flatMap = <R>(f: (a: T) => Option<R>): Option<R> =>
        this.constructor.name === 'None' ? none as Option<R>
            : f(this.value)

    // equals :: # M a -> M a -> boolean
    equals = (x: Option<T>) => this.toString() === x.toString()

    match<R>(success: (a: T) => R, empty: () => R): R {
        throw new Error('not implemented');
    }

    tap(f: (v: T) => any): Option<T> {
        this.match(
            v => f(v)
            ,
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

    match<R>(success: (a: T) => R, empty: () => R): R {
        return success(this.value);
    }

    toString() {
        return `Some(${this.value})`
    }
}
