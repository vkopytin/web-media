class ErrorWithStatus extends Error {

    static fromJqXhr<T extends { error?: { message?: string } }>(jqXHR: { responseJSON?: T; status: number; statusText: string; responseText: string; }) {
        const details = jqXHR.responseJSON;

        return new ErrorWithStatus(details?.error?.message || jqXHR.responseText,
            jqXHR.status,
            jqXHR.statusText,
            details
        );
    }

    constructor(public msg: string, public status: number, public statusText: string, public details?: unknown) {
        super(msg);

        this.name = 'ErrorWithStatus';

        Object.setPrototypeOf(this, ErrorWithStatus.prototype);
    }
}

export { ErrorWithStatus };
