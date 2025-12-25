import { none, Option, Some } from './option';

class Result<E = Error, R = unknown> {
    static of<E, R>(success: R) {
        return new Result<E, R>(null, success);
    }

    static error<E, R>(error: E) {
        return new Result<E, R>(error);
    }

    left = none as Option<E>;
    right!: R;

    constructor(...args: [E | null, R?]) {
        if (args.length === 2) {
            this.right = args[1] as R;
        } else {
            this.left = Some.pure(args[0] as E);
        }
    }

    tap(f: (v: R) => void): Result<E, R> {
        this.left.match(
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => { }
            ,
            () => f(this.right)
        );

        return this;
    }

    cata<T>(f: (v: R) => Result<E, T>): Result<E, T>;
    cata<T>(f: (v: R) => Promise<Result<E, T>>): Promise<Result<E, T>>;
    cata<T>(f: (v: R) => Result<E, T> | Promise<Result<E, T>>): Result<E, T> | Promise<Result<E, T>> {
        return this.left.match(
            e => Result.error(e)
            ,
            () => f(this.right)
        );
    }

    async await<T>(this: Result<E, Promise<T>>): Promise<Result<E, T>> {
        const res = this.match(async a => {
            const res = await a;
            return Result.of<E, T>(res);
        }, e => Promise.resolve(Result.error(e)));

        return res;
    }

    valueOrDefault(def: R): R {
        return this.match(
            v => v
            ,
            () => def
        );
    }

    map<T>(f: (v: R) => T): Result<E, T> {
        try {
            return this.left.match(
                e => Result.error(e)
                ,
                () => Result.of(f(this.right))
            );
        } catch (e) {
            return Result.error(e as E);
        }
    }

    error<T>(fn: (v: E) => T): Result<T, R> {
        return this.left.match(
            err => Result.error(fn(err))
            ,
            () => Result.of(this.right)
        );
    }

    orElse<T>(f: (v: E) => Result<E, T>): Result<E, T> {
        return this.left.match(
            v => f(v)
            ,
            () => Result.of(null as T)
        );
    }

    match<T>(success: (v: R) => T, error: (e: E) => T): T {
        try {
            return this.left.match(
                err => error(err)
                ,
                () => success(this.right)
            );
        } catch (e) {
            return error(e as E);
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    is(a: Function): boolean {
        return this.left.match(e => e instanceof a, () => this.right instanceof a);
    }
}

export { Result };
