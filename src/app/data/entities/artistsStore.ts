import { asAsync, asAsyncOf } from '../../utils';
import { IStorage, IStorageConfig } from "../iStorage";
import { IArtist } from './interfaces/iArtist';


export class ArtistsStore {
    tableName = 'artists';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'id'
        },
        index: {
            id: {
                id: { unique: true }
            },
            name: {
                name: {}
            }
        },
        orderBy: 'name',
        orderDesk: false
    };

    constructor(public storage: IStorage) {

    }

    createTable() {
        return asAsync(null, (cb: { (res?: Error | null, result?: boolean): void }) => {
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

    create(myStore: IArtist) {
        return asAsync(this.storage, this.storage.create, this.storeConfig, myStore);
    }

    update(myStore: IArtist) {
        return asAsync(this.storage, this.storage.update, this.storeConfig, myStore.id, myStore);
    }

    delete(myStore: string) {
        return asAsync(this.storage, this.storage.delete, this.storeConfig, myStore);
    }

    async refresh(myStore: IArtist) {
        const record = await asAsync(this.storage, this.storage.getById<IArtist>, this.storeConfig, myStore.id);
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

    list(offset = 0, limit?: number) {
        return asAsyncOf(null, (cb: { (res?: unknown, result?: IArtist, index?: number): boolean }) => {
            this.storage.each<IArtist>(this.storeConfig, (...args) => {
                const index = args[2] || 0;
                if (index < offset) {
                    return true;
                }
                if (limit && ((index + 1) > (offset + limit))) {
                    return cb();
                }
                return cb(...args);
            });
        });
    }

    where(where: { [key: string]: unknown }) {
        return asAsyncOf(this.storage, this.storage.where, this.storeConfig, where);
    }

    count() {
        return asAsync(this.storage, this.storage.getCount, this.storeConfig);
    }
}
