import { withEvents } from 'databindjs';
import * as _ from 'underscore';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import { GeniusServiceResult } from './results/geniusServiceResult';
import { GeniusAdapter } from '../adapter/genius';
import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { GeniusServiceError } from './errors/geniusServiceError';
import { GeniusServiceUnexpectedError } from './errors/geniusServiceUnexpectedError';


function returnErrorResult<T>(message: string, ex: Error) {
    switch (true) {
        case ex instanceof ErrorWithStatus:
            const err = ex as ErrorWithStatus;
            return GeniusServiceError.create(err.message, err);
        default:
            return GeniusServiceUnexpectedError.create<T>(message, ex);
    }
}

class GeniusService extends withEvents(BaseService) {
    static async create(connection: Service) {
        const accessToken = 'oEto0kMQmn9MyhQZPvOrZ4sgEc2RL_UUdZhd-rfm4_mpbJ-QQG5Ws2BrUuMzn9hv';
        const adapter = new GeniusAdapter(accessToken);
        return GeniusServiceResult.success(new GeniusService(adapter));
    }

    constructor(public adapter: GeniusAdapter) {
        super();
    }

    async search(term: string) {
        try {
            const lyrics = await this.adapter.search(term);

            return GeniusServiceResult.success(lyrics.lyrics);
        } catch (ex) {
            return returnErrorResult('Unexpected error on requesting sptify recently played', ex);
        }
    }
}

export { GeniusService };
