import * as express from 'express';
import * as _ from 'underscore';
import { ServiceResult } from '../../base/service_result';


const instTable = new WeakMap<express.Request, RMService>();

class RMService {

    static create(req: express.Request) {
        if (instTable.has(req)) {

            return instTable.get(req);
        }
        const inst = new RMService();

        instTable.set(req, inst);

        return inst;
    }

    private constructor() {
    }

    async service<T extends {}, O extends {}>(
        ctor: { prototype: T },
        options = {} as O
    ): Promise<ServiceResult<T, Error>> {
        switch (ctor) {
            default:
                throw new Error(`Failed to create undefined Service`);
        }
    }
}

export { RMService };
