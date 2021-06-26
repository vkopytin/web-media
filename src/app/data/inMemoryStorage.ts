import * as _ from 'underscore';
import { IStorage, IStorageConfig } from './iStorage';


const db = {};

class InMemoryStorage implements IStorage {
    db = db;
    constructor(public connection) {
    }

    initializeStructure(cb: { (err?, res?): void }) {
        cb(null, true);
    }
    
    hasTable(config: IStorageConfig, cb: { (err, res?): void }) {
        const tableName = config.name;

        cb(null, tableName in this.db);
    }

    createTable(config: IStorageConfig, cb: { (err, res?): void }) {
        const tableName = config.name;
        try {
            if (!this.db[tableName]) {
                this.db[tableName] = {};
            }

            cb(null, true);
        } catch (ex) {
            cb(ex);
        }
    }
    
    create(config: IStorageConfig, data: { id; }, cb: { (err, res?): void }) {
        const tableName = config.name;
        try {
            if (data.id in this.db[tableName]) {
                return cb(new Error('record already exists'));
            }
            this.db[tableName][data.id] = data;

            cb(null, data.id);
        } catch (ex) {
            cb(ex);
        }
    }

    update(config: IStorageConfig, id, data, cb: { (err, res?): void }) {
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

            cb(null, data.id);
        } catch (ex) {
            cb(ex, null);
        }

        return true;
    }

    delete(config: IStorageConfig, id, cb: { (err, result?): void }) {
        const tableName = config.name;
        try {
            delete this.db[tableName][id];
            cb(null, true);
        } catch (ex) {
            cb(ex);
        }
    }

    getById(config: IStorageConfig, id, cb: { (err, id?): void }) {
        const tableName = config.name;
        try {
            cb(null, this.db[tableName][id] || undefined);
        } catch (ex) {
            cb(ex);
        }
    }

    where(config: IStorageConfig, where: { [key: string]: any }, cb: { (err?, result?): boolean }) {
        
    }

    each(config: IStorageConfig, cb: { (err?, record?, index?: number): boolean }) {
        const tableName = config.name;
        let index = 0;
        for (const key in this.db[tableName]) {
            if (Object.prototype.hasOwnProperty.call(this.db[tableName], key)) {
                try {
                    const stop = cb(null, this.db[tableName][key] || null, index++) === false;
                    if (stop) {
                        return;
                    }
                } catch (ex) {
                    cb(ex, null);
                }
            }
        }

        cb();

        return true;
    }

    getCount(config: IStorageConfig, cb: { (err, res?): void }) {
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
            cb(ex);
        }
    }

    complete = _.debounce(this.completeInternal, 500);
    completeInternal() {
        console.log(db);
    }

}

export { InMemoryStorage };
