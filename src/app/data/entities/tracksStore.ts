import * as _ from 'underscore';
import { IStorage, IStorageConfig } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { ITrackRecord } from './interfaces';


class TracksStore {
    tableName = 'tracks';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'id'
        },
        index: {
            id: {
                id: { unique: true }
            },
            added_at: {
                added_at: {}
            }
        },
        orderBy: 'added_at',
        orderDesk: true
    };

    constructor(public storage: IStorage) {

    }

    async create(track: ITrackRecord) {
        const result = await asAsync(this.storage, this.storage.create, this.storeConfig, track);
        return result;
    }

    async update(track: ITrackRecord) {
        const result = await asAsync(this.storage, this.storage.update, this.storeConfig, track.id, track);
        return result;
    }

    async refresh(track: ITrackRecord) {
        const record = await asAsync(this.storage, this.storage.getById, this.storeConfig, track.id);
        if (record) {
            return this.update({
                ...record,
                ...track
            });
        } else {
            return this.create(track);
        }
    }

    get(trackId: string) {
        return asAsync(this.storage, this.storage.getById, this.storeConfig, trackId);
    }
    
    list(offset = 0, limit = 20) {
        return asAsyncOf(null, (cb: { (res?, result?, index?): boolean }) => {
            let index = 0;
            this.storage.each(this.storeConfig, (...args) => {
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
        return asAsync(this.storage, this.storage.createTable, this.storeConfig);
    }
}

export { TracksStore };
