import * as _ from 'underscore';
import { IStorage, IStorageConfig } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { IPlaylistRow } from './interfaces/iPlaylistRow';


export class PlaylistRowsStore {
    tableName = 'playlistRows';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'id',
            autoIncrement: true
        },
        index: {
            id: {
                id: { unique: true }
            },
            position: {
                position: { }
            }
        },
        orderBy: 'position',
        orderDesk: false
    };

    constructor(public storage: IStorage) {

    }

    createTable() {
        return asAsync(null, (cb: { (res?, result?) }) => {
            this.storage.hasTable(this.storeConfig, (err, res) => {
                if (err) {
                    return cb(err);
                }
                if (res) {
                    return cb(null, true);
                }
                this.storage.createTable(this.storeConfig, cb);
            });
        });
    }

    create(myStore: IPlaylistRow) {
        return asAsync(this.storage, this.storage.create, this.storeConfig, myStore);
    }

    update(record: IPlaylistRow) {
        return asAsync(this.storage, this.storage.update, this.storeConfig, record.id, record);
    }

    delete(id: string) {
        return asAsync(this.storage, this.storage.delete, this.storeConfig, id);
    }

    async refresh(myStore: IPlaylistRow) {
        const record = await asAsync(this.storage, this.storage.getById, this.storeConfig, myStore.id);
        if (record) {
            return await this.update({
                ...record,
                ...myStore
            });
        } else {
            return await this.create(myStore);
        }
    }

    get(myStoreId: string) {
        return asAsync(this.storage, this.storage.getById, this.storeConfig, myStoreId);
    }

    list(offset = 0, limit?) {
        return asAsyncOf(null, (cb: { (res?, result?: IPlaylistRow, index?): boolean }) => {
            this.storage.each<IPlaylistRow>(this.storeConfig, (...args) => {
                const index = args[2];
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

    where(where: Partial<IPlaylistRow>) {
        return asAsyncOf(this.storage, this.storage.where, this.storeConfig, where);
    }

    count() {
        return asAsync(this.storage, this.storage.getCount, this.storeConfig);
    }
}
