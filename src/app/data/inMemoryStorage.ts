import * as _ from 'underscore';

const db = {};

class InMemoryStorage {
    db = db;
    constructor(public connection) {
    }

    initializeStructure(cb: { (err?, res?): void }) {
        cb(null, true);
	}

    createTable(tableName, cb: { (err, res?): void }) {
        try {
            if (!this.db[tableName]) {
                this.db[tableName] = {};
            }

            cb(null, true);
        } catch (ex) {
            cb(ex);
        }
    }
    
    create(tableName: string, data: { id; }, cb: { (err, res?): void }) {
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

            cb(null, data.id);
        } catch (ex) {
            cb(ex, null);
        }

        return true;
    }

    delete(tableName: string, id, cb: { (err, result?): void }) {
        try {
            delete this.db[tableName][id];
            cb(null, true);
        } catch (ex) {
            cb(ex);
        }
    }

    getById(tableName: string, id, cb: { (err, id?): void }) {
        try {
            cb(null, this.db[tableName][id] || undefined);
        } catch (ex) {
            cb(ex);
        }
    }

    each(tableName: string, cb: { (err?, record?, index?: number): boolean }) {
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

    getCount(tableName, cb: { (err, res?): void }) {
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
