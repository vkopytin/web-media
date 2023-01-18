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

    tap(f: (v: R) => any): Result<E, R> {
        this.left.match(
            () => { }
            ,
            () => f(this.right)
        );

        return this;
    }

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
            e => def
        );
    }

    map<T>(f: (v: R) => T): Result<E, T> {
        return this.left.match(
            e => Result.error(e as unknown)
            ,
            () => Result.of(f(this.right))
        ) as any;
    }

    error<T>(f: (v: E) => T): Result<T, R> {
        return this.left.match(
            err => Result.error(f(err))
            ,
            () => Result.of(this.right)
        );
    }

    orElse<T>(f: (v: E) => T): T {
        return this.match(
            v => Result.of(v)
            ,
            e => f(e) as any
        )
    }

    match<T>(success: (v: R) => T, error: (e: E) => T): T {
        return this.left.match(
            err => error(err)
            ,
            () => success(this.right)
        );
    }

    is(a: new (...args: any[]) => E): boolean {
        return this.left.match(e => e instanceof a, () => this.right instanceof a);
    }
}

export { Result };
