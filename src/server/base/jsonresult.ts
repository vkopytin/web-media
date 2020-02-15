import { BaseResult } from './baseresult';


interface IJsonResultOptions {
    data: {};
}

class JsonResult extends BaseResult {
    json = {};

    constructor(options: IJsonResultOptions) {
        super();
        this.json = options.data;
    }

    async executeResult(context) {
        context.res.send(this.json);
    }
}

export { JsonResult };
