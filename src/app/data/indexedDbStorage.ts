import * as _ from 'underscore';
import { utils } from 'databindjs';
import { IStorage, IStorageConfig } from './iStorage';


class IndexedDbStorage implements IStorage {
	constructor(public connection: IDBOpenDBRequest) {
		this.connection = connection;
		this.connection.addEventListener('error', (event) => {
			console.log('Request error:', this.connection.error);
		});
	}

	initializeStructure(cb: { (err?: Error, res?: IDBDatabase): void }) {
		this.connection.onupgradeneeded = (evnt) => cb(null, this.connection.result);
		this.connection.onsuccess = () => cb(null);
		this.connection.onerror = () => cb(this.connection.error);
	}

	hasTable(config: IStorageConfig, cb: { (err: Error, res?: boolean): void }) {
		const tableName = config.name;
		try {
			const res = this.connection.result;
			const tr = this.connection.transaction;
			const store = tr.objectStore(tableName);

			cb(null, !!store);
		}
		catch (e) {
			cb(null, false);
		}
	}

	createTable(config: IStorageConfig, cb: { (err: Error, res?: IDBDatabase): void }) {
		try {
			const tableName = config.name;
			const res = this.connection.result;
			const store = res.createObjectStore(tableName, config.options);
			_.each(config.index, (details: any, indexName) => {
				_.each(details, (options, keyPath: string) => {
					store.createIndex(indexName, keyPath, options);
				});
			});

			cb(null, res);
		} catch (ex) {
			cb(ex);
		}
	}

	getIdIndex(config: IStorageConfig) {
		const firstIndex = _.first(_.keys(config.index));
		return firstIndex;
	}

	create<T>(config: IStorageConfig, data: { id: IDBValidKey | IDBKeyRange; }, cb: { (err: Event | Error, res?: T): void }) {
		const tableName = config.name;
		const exec = (evnt: Event) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Creating ${tableName} with id: ${data.id}`);
			const timeout = setTimeout(() => cb(new Error('Create: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readwrite');
			tr.onerror = err => {
				//console.log(`Failed 1 creating ${tableName} with id: ${data.id}`);
				clearInterval(timeout);
				cb(err);
			}
			const store = tr.objectStore(tableName);
			const request = store.add(data);
			request.onsuccess = evnt => {
				clearInterval(timeout);
				//console.log(`Finished creating ${tableName} with id: ${data.id}`);
				cb(null, (request.result || null) as unknown as T);
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

	update<T>(config: IStorageConfig, id: IDBValidKey | IDBKeyRange, data: {}, cb: { (err: Event | Error, res?: T): void }) {
		const tableName = config.name;
		const exec = (evnt: Event) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Updating ${tableName} with id: ${data.id}`);
			const timeout = setTimeout(() => cb(new Error('Update: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readwrite');
			const store = tr.objectStore(tableName);
			tr.onerror = err => {
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
				cb(null, (request.result || null) as unknown as T);
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

	delete(config: IStorageConfig, id: IDBValidKey | IDBKeyRange, cb: { (err: Event | Error, result?: boolean): void }): void {
		const tableName = config.name;
		const exec = (evnt: Event) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Delete ${tableName} with id: ${id}`);
			const timeout = setTimeout(() => cb(new Error('Update: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readwrite');
			const store = tr.objectStore(tableName);
			tr.onerror = err => {
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

	getById<T>(config: IStorageConfig, id: IDBValidKey | IDBKeyRange, cb: { (err?: Event | Error, res?: T): void }): void {
		const tableName = config.name;
		const exec = (evnt: Event) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Getting ${tableName} by id: ${id}`);
			const timeout = setTimeout(() => cb(new Error('Update: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readonly');
			const store = tr.objectStore(tableName);
			tr.onerror = err => {
				clearInterval(timeout);
				cb(err);
			}
			const idIndexName = this.getIdIndex(config);
			const index = idIndexName ? store.index(idIndexName) : store;
			const request = index.get(id);
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

	each<T>(config: IStorageConfig, cb: { (err?: Error | Event, record?: T, index?: number): boolean }) {
		const tableName = config.name;
		const exec = (evnt: Event) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Looping over ${tableName}`);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readonly');
			const store = tr.objectStore(tableName);
			tr.onerror = err => {
				cb(err);
			}
			tr.oncomplete = evnt => {
				cb();
			}
			const index = config.orderBy ? store.index(config.orderBy) : store;
			const cursor = config.orderDesk
				? index.openCursor(null, 'prev')
				: index.openCursor(null, 'next');
			let indexNumber = 0;
			cursor.onsuccess = (event: any) => {
				try {
					const res = event.target.result;
					if (res) {
						try {
							const stop = cb(null, res.value || null, indexNumber++) === true;
							if (stop) {
								tr.abort();
							} else {
								res.continue();
							}
						} catch (ex) {
							cb(ex);
						}
					}
				} catch (ex) {
					cb(ex);
				}
			};
			cursor.onerror = err => {
				cb(err);
			}
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}

	where<T>(config: IStorageConfig, where: { [key: string]: any }, cb: { (err?: Error | Event, result?: T, index?: number): boolean }): void {
		const tableName = config.name;
		const keys = _.keys(where);

		const exec = (evnt: Event) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Looping over ${tableName}`);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readonly');
			tr.onerror = err => {
				cb(err);
			}
			tr.oncomplete = evnt => {
				cb();
			}
			const store = tr.objectStore(tableName);
			const indexes = _.intersection(keys, store.indexNames);
			const order = config.orderDesk ? 'prev' : 'next';
			const index = config.orderBy ? store.index(config.orderBy) : indexes.length ? store.index(indexes[0]) : store;
			const keyRange = config.orderBy ? null : indexes.length ? IDBKeyRange.only(where[indexes[0]]) : null;
			const cursor = index.openCursor(keyRange, order);
			let indexNumber = 0;
			cursor.onsuccess = (event: any) => {
				try {
					const res = event.target.result;
					if (res) {
						const equals = _.reduce(where, (result, value, key) => {
							return result && value === (res.value && res.value[key]);
						}, true);
						let stop = false;
						if (equals) {
							stop = cb(null, res.value || null, indexNumber++) === true;
						}
						if (stop) {
							tr.abort();
						} else {
							res.continue();
						}
					}
				} catch (ex) {
					cb(ex);
				}
			};
			cursor.onerror = err => {
				cb(err);
			}
		};
		if (_.result(this.connection, 'readyState') !== 'done') {
			this.connection.addEventListener('success', exec);
		} else {
			exec(null);
		}
	}

	getCount(config: IStorageConfig, cb: { (err: Event | Error, res?: number): void }) {
		const tableName = config.name;
		const exec = (evnt: Event) => {
			if (evnt !== null) {
				this.connection.removeEventListener('success', exec);
			}
			//console.log(`Getting ${tableName} by id: ${id}`);
			const timeout = setTimeout(() => cb(new Error('Update: timeout operation')), 60 * 1000);
			const res = this.connection.result;
			const tr = res.transaction(tableName, 'readonly');
			tr.onerror = err => {
				clearInterval(timeout);
				cb(err);
			}
			const store = tr.objectStore(tableName);
			const idIndexName = this.getIdIndex(config);
			const index = idIndexName ? store.index(idIndexName) : store;
			const request = index.count();
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

	complete() {
		const exec = (evnt: Event) => {
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
