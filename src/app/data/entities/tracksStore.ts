import * as _ from 'underscore';
import { IStorage } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { ITrackRecord } from './interfaces';


class TracksStore {
    tableName = 'tracks';

    constructor(public storage: IStorage) {

    }

    async create(track: ITrackRecord) {
        const result = await asAsync(this.storage, this.storage.create, this.tableName, track);
        return result;
    }

    async update(track: ITrackRecord) {
        const result = await asAsync(this.storage, this.storage.update, this.tableName, track.id, track);
        return result;
    }

    async refresh(track: ITrackRecord) {
        const record = await asAsync(this.storage, this.storage.getById, this.tableName, track.id);
        if (record) {
            return this.update(track);
        } else {
            return this.create(track);
        }
    }

    get(trackId: string) {
        return asAsync(this.storage, this.storage.getById, this.tableName, trackId);
    }
    
    list(offset = 0, limit = 20) {
        return asAsyncOf(null, (cb: { (res?, result?, index?): boolean }) => {
            let index = 0;
            this.storage.each(this.tableName, (...args) => {
                if (index < offset) {
                    return;
                }
                if (index > offset + limit) {
                    return cb();
                }
                index++;
                return cb(...args);
            });
        });
    }

    async createTable() {
        return asAsync(this.storage, this.storage.createTable, this.tableName);
    }
}

export { TracksStore };
