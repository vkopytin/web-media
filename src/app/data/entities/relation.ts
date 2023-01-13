import * as _ from 'underscore';
import { IStorage, IStorageConfig } from '../iStorage';
import { asAsync, asAsyncOf } from '../../utils';

class Relation<T extends { [key: string]: unknown }> {
    tableName = '';
    leftKey = '';
    rightKey = '';
    storeConfig: IStorageConfig = {
        name: this.tableName,
        options: {
            keyPath: 'id'
        }
    };

    constructor(public storage: IStorage, relation: T) {
        [this.leftKey, this.rightKey] = Object.keys(relation).sort();
        this.tableName = '@' + [this.leftKey, this.rightKey].join('+');
        this.storeConfig.index = {
            id: {
                id: {
                    unique: true
                }
            },
            [this.leftKey]: {
                [this.leftKey]: {
                }
            },
            [this.rightKey]: {
                [this.rightKey]: {

                }
            }
        }
        this.storeConfig.name = this.tableName;
    }

    getId(pair: T) {
        return [pair[this.leftKey], pair[this.rightKey]].join(':');
    }

    async createTable() {
        return asAsync(this.storage, this.storage.createTable, this.storeConfig);
    }

    async create(pair: T) {
        const result = await asAsync(this.storage, this.storage.create, this.storeConfig, {
            id: this.getId(pair),
            ...pair
        });
        return result;
    }

    async update(pair: T) {
        const id = this.getId(pair);
        const result = await asAsync(this.storage, this.storage.update<T>, this.storeConfig, id, {
            id,
            ...pair
        });
        return result;
    }

    async delete(pair: T) {
        const result = await asAsync(this.storage, this.storage.delete, this.storeConfig, this.getId(pair));
        return result;
    }

    async refresh(pair: T) {
        const id = this.getId(pair);
        const record = await asAsync(this.storage, this.storage.getById<T>, this.storeConfig, id);
        if (record) {
            return await this.update({
                ...record,
                ...pair
            });
        } else {
            return await this.create(pair);
        }
    }

    get(pair: T) {
        return asAsync(this.storage, this.storage.getById, this.storeConfig, this.getId(pair));
    }

    list(offset = 0, limit?: number) {
        return asAsyncOf(this.storage, this.storage.each as ((config: IStorageConfig, cb: (err?: any, result?: T, index?: number) => boolean) => any), this.storeConfig);
    }

    where(where: Partial<T>) {
        return asAsyncOf(this.storage, this.storage.where, this.storeConfig, where);
    }

    count() {
        return asAsync(this.storage, this.storage.getCount, this.storeConfig);
    }

    eachBy<K extends keyof T>(key: K, keyId: T[K]) {
        return asAsyncOf(null, (cb: { (err?: unknown, result?: T, index?: number): boolean }) => {
            this.storage.each(this.storeConfig, (err, result?: T, index?) => {
                if (_.isUndefined(result)) {
                    cb();
                    return true;
                }
                if (result && result[key] === keyId) {
                    cb(err, result, index);
                    return false;
                }
                return true;
            });
        });
    }
}

export { Relation };
