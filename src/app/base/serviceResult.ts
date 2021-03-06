import e from "express";

class ServiceResult<T, E extends Error> {
    isError = false;

    constructor(public val: T, public error: E) {
        this.isError = !!error;
    }

    is(a: new (...args) => E): boolean {

        return this.error instanceof a;
    }

    assert(err: (e: ServiceResult<T, E>) => void): ServiceResult<T, E> {
        if (this.isError) {
            err(this);
        }
        return this;
    }

    map<R>(done: (v: T) => R): ServiceResult<R, Error> {
        if (this.isError) {
            return this as any;
        }
        return new ServiceResult<R, Error>(done(this.val), null);
    }

    cata<R>(done: (v: T) => R): R {
        if (this.isError) {
            return this as any;
        }
        return done(this.val);
    }
}

export { ServiceResult };
