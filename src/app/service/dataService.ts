import { withEvents } from 'databindjs';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import * as _ from 'underscore';
import { DataServiceResult } from './results/dataServiceResult';
import { initializeStructure } from '../data/useCases';


class DataService extends withEvents(BaseService) {
    static async create(connection: Service) {
        await initializeStructure();
        return DataServiceResult.success(new DataService(connection));
    }

    constructor(public ss: Service) {
        super();
    }
}

export { DataService };
