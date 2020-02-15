class BaseResult {
    getTemplatePath(context) {
        return [context.controllerName, context.actionName].join('/');
    }

    executeResult(context) {
        context.res.send('Not implemented');
    }

    render(path) {
        return new Promise((resolve, reject) => {
            try {
                const [a, controllerName, actionName] = /([^\/\.]+)\/([^/\\.]+)/gi.exec(path);
                this.executeResult({
                    controllerName,
                    actionName,
                    res: {
                        send: text => resolve(text)
                    }
                });
            } catch (ex) {
                reject(ex);
            }
        });
    }
}

export { BaseResult };
