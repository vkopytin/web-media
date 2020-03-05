import * as _ from 'underscore';
import { IStorage, IStorageConfig } from './iStorage';


class RemoteStorage implements IStorage {
    constructor(public connection) {
    }

    initializeStructure(cb: { (err?, res?): void }) {
        cb(null, false);
	}

    createTable(config: IStorageConfig, cb: { (err, res?): void }) {
        try {
            cb(null, false);
        } catch (ex) {
            cb(ex);
        }
    }
    
    create(config: IStorageConfig, data: { id; }, cb: { (err, res?): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex);
        }
    }

    update(config: IStorageConfig, id, data, cb: { (err, res?): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex, null);
        }

        return true;
    }

    delete(config: IStorageConfig, id, cb: { (err, result?): void }) {
        try {
            cb(null, false);
        } catch (ex) {
            cb(ex);
        }
    }

    getById(config: IStorageConfig, id, cb: { (err, id?): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex);
        }
    }

    where(config: IStorageConfig, where: { [key: string]: any }, cb: { (err?, result?): boolean }) {
        
    }

    each(config: IStorageConfig, cb: { (err?, record?, index?: number): boolean }) {
        let index = 0;

        cb();

        return true;
    }

    getCount(config: IStorageConfig, cb: { (err, res?): void }) {
        try {
            let count = 0;

            cb(null, count);
        } catch (ex) {
            cb(ex);
        }
    }

    complete() {

    }
}

export { RemoteStorage };
