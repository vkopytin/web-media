import * as _ from 'underscore';
import { IStorage, IStorageConfig } from "../iStorage";
import { asAsync, asAsyncOf } from '../../utils';
import { IImage } from './interfaces/iImage';


export class ImagesStore {
    tableName = 'images';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'url'
        },
        index: {
            url: {
                url: { unique: true }
            }
        },
        orderBy: 'url',
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

    create(myStore: IImage) {
        return asAsync(this.storage, this.storage.create, this.storeConfig, myStore);
    }

    update(myStore: IImage) {
        return asAsync(this.storage, this.storage.update, this.storeConfig, myStore.url, myStore);
    }

    delete(myStore: string) {
        return asAsync(this.storage, this.storage.delete, this.storeConfig, myStore);
    }

    async refresh(myStore: IImage) {
        const record = await asAsync(this.storage, this.storage.getById, this.storeConfig, myStore.url);
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
        return asAsyncOf(null, (cb: { (res?, result?: IImage, index?): boolean }) => {
            this.storage.each<IImage>(this.storeConfig, (...args) => {
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

    where(where: { [key: string]: any }) {
        return asAsyncOf(this.storage, this.storage.where, this.storeConfig, where);
    }

    count() {
        return asAsync(this.storage, this.storage.getCount, this.storeConfig);
    }
}
