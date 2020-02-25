import * as _ from 'underscore';

const db = {};

class InMemoryStorage {
    db = db;
    constructor(public connection) {
    }

    createTable(tableName, cb: { (err, res?): void }) {
        if (!this.db[tableName]) {
            this.db[tableName] = {};
        }
        cb(null, true);
    }
    
    create(tableName: string, data: { id; }, cb: { (err, res?): void }) {
        this.db[tableName][data.id] = data;
        cb(null, data.id);

        return true;
    }

    update(tableName: string, id, data, cb: { (err, res?): void }) {
        try {
            const item = this.db[tableName][id];
            if (!item) {
                throw new Error('Item not found, please create it first');
            }

            this.db[tableName][id] = {
                ...item,
                ...data
            };

        } catch (ex) {
            cb(ex, null);
        }
        cb(null, true);

        return true;
    }

    delete(tableName: string, id, cb: { (err, result?): void }) {
        delete this.db[tableName][id];
        cb(null, true);
        return true;
    }

    getById(tableName: string, id, cb: { (err, id?): void }) {
        cb(null, this.db[tableName][id] || null);
    }

    list(tableName: string, cb: { (err, record?): void }) {
        for (const key in this.db) {
            if (Object.prototype.hasOwnProperty.call(this.db[tableName], key)) {
                try {
                    cb(null, this.db[tableName][key]);
                } catch (ex) {
                    cb(ex, null);
                }
            }
        }

        return true;
    }

    getCount(tableName, cb: { (err, res?): void }) {
        let count = 0;
        for (const k in db[tableName]) {
            if (db[tableName].hasOwnProperty(k)) {
                ++count;
            }
        }

        cb(null, count);
    }

    query(query, params, callback) {
        return callback(false);
    }

    complete = _.debounce(this.completeInternal, 500)

    completeInternal() {
        console.log(db);
    }

}

export { InMemoryStorage };
