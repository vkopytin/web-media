import * as _ from 'underscore';
import { IStorage, IStorageConfig } from './iStorage';


const db = {} as { [key: string]: { [key: string]: {} } };

class InMemoryStorage implements IStorage {
    db = db;
    constructor(public connection: string) {
    }

    initializeStructure(cb: { (err?: Error | null, res?: boolean): void }): void {
        cb(null, true);
    }

    hasTable(config: IStorageConfig, cb: { (err?: Error | null, res?: boolean): void }) {
        const tableName = config.name;

        cb(null, tableName in this.db);
    }

    createTable(config: IStorageConfig, cb: { (err: Error | null, res?: boolean): void }) {
        const tableName = config.name;
        try {
            if (!this.db[tableName]) {
                this.db[tableName] = {};
            }

            cb(null, true);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    create(config: IStorageConfig, data: { id: string; }, cb: { (err: Error | null, res?: unknown): void }) {
        const tableName = config.name;
        try {
            if (data.id in this.db[tableName]) {
                return cb(new Error('record already exists'));
            }
            this.db[tableName][data.id] = data;

            cb(null, data.id);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    update<T>(config: IStorageConfig, id: string, data: { id: string }, cb: { (err: Error | null, res?: T): void }) {
        const tableName = config.name;
        try {
            const item = this.db[tableName][id];
            if (!item) {
                throw new Error('Item not found, please create it first');
            }

            this.db[tableName][id] = {
                ...item,
                ...data
            };

            cb(null, data.id as unknown as T);
        } catch (ex) {
            cb(ex as Error);
        }

        return true;
    }

    delete(config: IStorageConfig, id: string, cb: { (err: Error | null, result?: boolean): void }) {
        const tableName = config.name;
        try {
            delete this.db[tableName][id];
            cb(null, true);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    getById<T>(config: IStorageConfig, id: string, cb: { (err: Error | null, res?: T): void }) {
        const tableName = config.name;
        try {
            cb(null, (this.db[tableName][id] || undefined) as T);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    where<T>(config: IStorageConfig, where: { [key: string]: any }, cb: { (err?: Error | null, result?: T): boolean }) {

    }

    each<T>(config: IStorageConfig, cb: { (err?: Error | null, record?: T, index?: number): boolean }) {
        const tableName = config.name;
        let index = 0;
        for (const key in this.db[tableName]) {
            if (Object.prototype.hasOwnProperty.call(this.db[tableName], key)) {
                try {
                    const stop = cb(null, (this.db[tableName][key] || null) as T, index++) === false;
                    if (stop) {
                        return;
                    }
                } catch (ex) {
                    cb(ex as Error);
                }
            }
        }

        cb();

        return true;
    }

    getCount(config: IStorageConfig, cb: { (err: Error | null, res?: number): void }) {
        const tableName = config.name;
        try {
            let count = 0;
            for (const k in db[tableName]) {
                if (db[tableName].hasOwnProperty(k)) {
                    ++count;
                }
            }

            cb(null, count);
        } catch (ex) {
            cb(ex as Error);
        }
    }

    complete = _.debounce(this.completeInternal, 500);
    completeInternal() {
        console.log(db);
    }

}

export { InMemoryStorage };
