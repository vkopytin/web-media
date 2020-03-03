import * as _ from 'underscore';
import { utils } from 'databindjs';
import { IStorage } from './iStorage';


const using = <T extends { onsuccess; onerror; result; error; onupgradeneeded; }, R>(obj: T, next: (err, res?: any) => any) => {
    const origNext = next;
	const run = () => {
		if (_.result(obj, 'readyState') === 'done') {
			return next === origNext ? null : next(null, obj.result);
		}
        obj.onupgradeneeded = (evnt) => origNext(null, obj.result);
        if ('onsuccess' in obj) {
            obj.onsuccess = (evnt) => next === origNext ? null : next(null, obj.result);
        } else {
            next === origNext ? null : next(null, obj.result);
        }
        obj.onerror = () => next(obj.error);
    }

    const enqueNext = (newFn: (err, res?) => any) => {
        const oldNext = next;
        next = (err, res: any) => {
			const result = oldNext(err, res);
			if ('onsuccess' in result) {
				result.onsuccess = () => newFn(null, result.result);
			} else if ('oncomplete' in result) {
				result.oncomplete = () => newFn(null, result.result);
            } else {
                return newFn(null, result);
            }
            //result.onerror || (result.onerror = () => newFn(result.error));
            return result;
        };

        return {
            next: enqueNext,
            run: run
        };
    };

    return {
        next: enqueNext,
        run: run
    };
}

class IndexedDbStorage implements IStorage {
	constructor(public connection) {
		this.connection = connection;
		this.connection.addEventListener('error', (event) => {
			console.log('Request error:', this.connection.error);
		  });
	}

	initializeStructure(cb: { (err?, res?): void }) {
		this.connection.onupgradeneeded = (evnt) => cb(null, this.connection.result);
        this.connection.onsuccess = () => cb(null);
        this.connection.onerror = () => cb(this.connection.error);
	}

	createTable(tableName, cb: { (err, res?): void }) {
		try {
			const res = this.connection.result;
			const store = res.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
			store.createIndex('id_unique', 'id', { unique: true });

			cb(null, res);
		} catch (ex) {
			cb(ex);
		}
	}
	
	create(tableName: string, data: { id; }, cb: { (err, res?): void }) {
		const exec = (evnt) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Creating ${tableName} with id: ${data.id}`);
			const timeout = setTimeout(() => cb(new Error('Create: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readwrite');
			const store = tr.objectStore(tableName);
			store.onerror = err => {
				//console.log(`Failed 1 creating ${tableName} with id: ${data.id}`);
				clearInterval(timeout);
				cb(err);
			}
			const request = store.add(data);
			request.onsuccess = evnt => {
				clearInterval(timeout);
				//console.log(`Finished creating ${tableName} with id: ${data.id}`);
				cb(null, request.result || null);
			}
			request.onerror = err => {
				//console.log(`Failed 2 creating ${tableName} with id: ${data.id}`);
				clearInterval(timeout);
				cb(err);
			}
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}

	update(tableName: string, id, data, cb: { (err, res?): void }) {
		const exec = (evnt) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Updating ${tableName} with id: ${data.id}`);
			const timeout = setTimeout(() => cb(new Error('Update: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readwrite');
			const store = tr.objectStore(tableName);
			store.onerror = err => {
				clearInterval(timeout);
				//console.log(`Failed 1 updating ${tableName} with id: ${data.id}`);
				cb(err);
			}
			const request = store.put({
                id: id,
                ...data
			});
			request.onsuccess = evnt => {
				clearInterval(timeout);
				//console.log(`Finished updating ${tableName} with id: ${data.id}`);
				cb(null, request.result || null);
			}
			request.onerror = err => {
				//console.log(`Failed 2 updating ${tableName} with id: ${data.id}`);
				clearInterval(timeout);
				cb(err);
			}
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}

	delete(tableName: string, id, cb: { (err, result?): void }) {
		const exec = (evnt) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Delete ${tableName} with id: ${id}`);
			const timeout = setTimeout(() => cb(new Error('Update: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readwrite');
			const store = tr.objectStore(tableName);
			store.onerror = err => {
				clearInterval(timeout);
				cb(err);
			}
			var request = store.delete(id);
			request.onsuccess = evnt => {
				clearInterval(timeout);
				cb(null, request.result || null);
			}
			request.onerror = err => {
				clearInterval(timeout);
				cb(err);
			}
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}

	getById(tableName: string, id, cb: { (err?, id?): void }) {
		const exec = (evnt) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Getting ${tableName} by id: ${id}`);
			const timeout = setTimeout(() => cb(new Error('Update: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readonly');
			const store = tr.objectStore(tableName);
			store.onerror = err => {
				clearInterval(timeout);
				cb(err);
			}
			const request = store.get(id);
			request.onsuccess = evnt => {
				clearInterval(timeout);
				cb(null, request.result || null);
			}
			request.onerror = err => {
				clearInterval(timeout);
				cb(err);
			}
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}

	each(tableName: string, cb: { (err?, record?, index?: number): boolean }) {
		const queue = utils.asyncQueue();
		const exec = (evnt) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			queue.push(next => {
				//console.log(`Looping over ${tableName}`);
				const res = this.connection.result;
				const tr = res.transaction(tableName, 'readonly');
				const store = tr.objectStore(tableName);
				store.onerror = err => {
					cb(err);
					next();
				}
				tr.oncomplete = evnt => {
					cb();
					next();
				}
				const cursor = store.openCursor();
				cursor.onsuccess = event => {
					const res = event.target.result;
					if (res) {
						const stop = cb(null, res.value || null) === true;
						if (stop) {
							tr.abort();
						} else {
							res.continue();
						}
					}
				};
				cursor.onerror = err => {
					cb(err);
					next();
				}
			});
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}

	getCount(tableName, cb: { (err, res?): void }) {
		using(this.connection, (err, res) => res)
			.next((err, res) => {
				return res.transaction(tableName, 'readonly');
			})
			.next((err, tr) => {
				const store = tr.objectStore(tableName);
				return store.count();
			})
			.next((err, res) => {
				if (err) {
					cb(err);
				} else {
					cb(res);
				}
				return res;
			}).run();
	}

	complete() {
		const exec = (evnt) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			this.connection.result.close();
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}
}

export { IndexedDbStorage };
