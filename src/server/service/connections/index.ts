import * as express from 'express';
import * as _ from 'underscore';
import { ServiceResult } from '../../base/service_result';
import { DummyService } from '../dummyService';
import { BaseService } from '../../base/service';


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

    async getDummyService() {
        const inst = this.service(DummyService);

        return inst;
    }

    async service<T extends BaseService, O extends {}>(
        ctor: { prototype: Partial<T> },
        options = {} as O
    ): Promise<ServiceResult<T, Error>> {
        switch (ctor) {
            case DummyService:
                return DummyService.create(this);
            default:
                throw new Error(`Failed to create undefined Service`);
        }
    }
}

export { RMService };
