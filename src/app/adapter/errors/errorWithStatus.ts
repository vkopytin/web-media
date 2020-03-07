class ErrorWithStatus extends Error {

    static fromJqXhr(jqXHR) {
        const details = jqXHR.responseJSON;
                    
        return new ErrorWithStatus(details?.error?.message || jqXHR.responseText,
            jqXHR.status,
            jqXHR.statusText,
            details
        );
    }

    constructor(public msg, public status: number, public statusText: string,  public details) {
        super(msg);

        this.name = 'ErrorWithStatus';

        Object.setPrototypeOf(this, ErrorWithStatus.prototype);
    }
}

export { ErrorWithStatus };
