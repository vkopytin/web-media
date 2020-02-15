import { BaseResult } from './baseresult';

interface IViewOptions {
    name?: string;
    data?: {};
}

class ViewResult extends BaseResult {
    viewName = null;
    viewData = {};
    constructor(options: IViewOptions) {
        super();
        this.viewName = options.name;
        this.viewData = options.data;
    }

    executeResult(context) {
        const templatePath = this.getTemplatePath(context);

        return context.res.render(templatePath, this.viewData);
    }
}

export { ViewResult };
