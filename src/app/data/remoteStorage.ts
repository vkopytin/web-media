import * as _ from 'underscore';
import { IStorage } from './iStorage';


class RemoteStorage implements IStorage {
    constructor(public connection) {
    }

    initializeStructure(cb: { (err?, res?): void }) {
        cb(null, false);
	}

    createTable(tableName, cb: { (err, res?): void }) {
        try {
            cb(null, false);
        } catch (ex) {
            cb(ex);
        }
    }
    
    create(tableName: string, data: { id; }, cb: { (err, res?): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex);
        }
    }

    update(tableName: string, id, data, cb: { (err, res?): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex, null);
        }

        return true;
    }

    delete(tableName: string, id, cb: { (err, result?): void }) {
        try {
            cb(null, false);
        } catch (ex) {
            cb(ex);
        }
    }

    getById(tableName: string, id, cb: { (err, id?): void }) {
        try {
            cb(null, null);
        } catch (ex) {
            cb(ex);
        }
    }

    each(tableName: string, cb: { (err?, record?, index?: number): boolean }) {
        let index = 0;

        cb();

        return true;
    }

    getCount(tableName, cb: { (err, res?): void }) {
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
