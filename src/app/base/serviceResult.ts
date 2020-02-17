class ServiceResult<T, E extends Error> {
    isError = false;

    constructor(public val: T, public error: E) {
        this.isError = !!error;
    }

    is(a: new (...args) => E): boolean {

        return this.error instanceof a;
    }
}

export { ServiceResult };
