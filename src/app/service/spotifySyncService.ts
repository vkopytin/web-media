import { withEvents } from 'databindjs';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import { assertNoErrors } from '../utils';
import * as _ from 'underscore';
import { IResponseResult, ISpotifySong } from '../adapter/spotify';
import { SpotifySyncServiceResult } from './results/spotifySyncServiceResult';
import { putMyTracks } from '../data/useCases';


class SpotifySyncService extends withEvents(BaseService) {
    static async create(connection: Service) {
        return SpotifySyncServiceResult.success(new SpotifySyncService(connection));
    }

    limit = 49;

    constructor(public ss: Service) {
        super();
    }

    async syncData() {
        for await (const songs of this.listMyTracks()) {
            await putMyTracks(_.map(songs, song => ({
                added_at: song.added_at,
                ...song.track
            })));
        }
    }

    async * listMyTracks() {
        let total = this.limit;
        let offset = 0;
        while (offset !== total) {
            const result = await this.ss.fetchTracks(offset, this.limit + 1);
            if (assertNoErrors(result, e => _.delay(() => { throw e; }))) {
                return;
            }
            const response = result.val as IResponseResult<ISpotifySong>;
            total = offset + Math.min(this.limit + 1, response.items.length);
            offset = offset + Math.min(this.limit, response.items.length);

            yield response.items;
        }
    }
}

export { SpotifySyncService };
