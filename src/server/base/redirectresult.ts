import { BaseResult } from './baseresult';


class RedirectResult extends BaseResult {
    redirectUri = '';

    constructor(options: { redirectUri: string }) {
        super();
        this.redirectUri = options.redirectUri;
    }
    async executeResult(context) {
        context.res.redirect(this.redirectUri);
    }
}

export { RedirectResult };
