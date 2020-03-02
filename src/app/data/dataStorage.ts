import { utils } from 'databindjs';

const queue = utils.asyncQueue();

const serviceId = 'spotify-data-storage';
const config = {
	//DbType: 'inMemory'
	DbType: 'indexedDB'
};

export interface IStorage {
	initializeStructure(cb: { (err, res?): void });
	complete();
}

// Unit of Work Factory
class DataStorage {
	static create(callback: { (err, result: IStorage): void }) {
		queue.push(next => {
			switch (config.DbType) {
				case 'inMemory':
					const { InMemoryStorage } = require('./inMemoryStorage');
					const uow = new InMemoryStorage();

					callback(null, uow);
					break;
				case 'indexedDB':
					try {
						const { IndexedDbStorage } = require('./indexedDbStorage');
						const connection = indexedDB.open(serviceId, 1);
						const uow = new IndexedDbStorage(connection);
						callback(null, uow);
					} catch (ex) {
						throw ex;
					}
					break;
			}
			next();
		});
	}
}

export { DataStorage };
