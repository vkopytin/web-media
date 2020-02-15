import * as express from 'express';
import { Controller } from '../base/controller';
import { ControllerFactory } from '../controllers/controllerfactory';
import { Logger } from '../logger';


function handler<T extends Controller>(
    ControllerCtor: new (...args) => T,
    f: (i: T) => (...args) => Promise<{ executeResult(a: {}) }>
) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const ic = ControllerFactory.create(ControllerCtor, req, res);
            const ar = f(ic);
            Logger.current.log(`Route to controller ${ControllerCtor.name} action ${ar.name}`);
            const result = await ar.call(ic, {
                ...req.params,
                ...req.body,
                ...req.query
            });
            // toDO: Refactor to support render engine
            // res.render(`${ControllerCtor.name.toLowerCase()}/${ar.name.toLowerCase()}.mmm`, result);
            result.executeResult({
               controllerName: ControllerCtor.name.toLowerCase(),
               actionName: ar.name.toLowerCase(),
               res: res
            });
        } catch (ex) {
            next(ex);
        }
    };
}

export { handler };
