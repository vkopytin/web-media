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

    async createTable() {
        return asAsync(this.storage, this.storage.createTable, this.storeConfig);
    }

    async create(track: ITrackRecord) {
        const result = await asAsync(this.storage, this.storage.create, this.storeConfig, track);
        return result;
    }

    async update(track: ITrackRecord) {
        const result = await asAsync(this.storage, this.storage.update, this.storeConfig, track.id, track);
        return result;
    }

    async delete(trackId: string) {
        const result = await asAsync(this.storage, this.storage.delete, this.storeConfig, trackId);
        return result;
    }

    async refresh(track: ITrackRecord) {
        const record = await asAsync(this.storage, this.storage.getById, this.storeConfig, track.id);
        if (record) {
            return await this.update({
                ...record,
                ...track
            });
        } else {
            return await this.create(track);
        }
    }

    get(trackId: string): Promise<ITrackRecord> {
        return asAsync(this.storage, this.storage.getById, this.storeConfig, trackId);
    }
    
    list(offset = 0, limit?) {
        return asAsyncOf(null, (cb: { (res?, result?, index?): boolean }) => {
            this.storage.each(this.storeConfig, (...args) => {
                const index = args[2] || offset;
                if (index < offset) {
                    return;
                }
                if (limit && ((index + 1) > (offset + limit))) {
                    return cb();
                }
                return cb(...args);
            });
        });
    }

    count() {
        return asAsync(this.storage, this.storage.getCount, this.storeConfig);
    }
}

export { TracksStore };
