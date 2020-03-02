import { utils } from 'databindjs';
import { IStorage } from './iStorage';


const queue = utils.asyncQueue();

const serviceId = 'spotify-data-storage';

interface IConfig {
	dbType: 'remote' | 'inMemory' | 'indexedDb'
}

const config: IConfig = {
	//DbType: 'inMemory'
	dbType: 'indexedDb'
};

// Unit of Work Factory
class DataStorage {
	static create(callback: { (err, result: IStorage): void }) {
		queue.push(next => {
			switch (config.dbType) {
				case 'inMemory':
					import('./inMemoryStorage').then(({ InMemoryStorage }) => {
						const uow = new InMemoryStorage(null);

						callback(null, uow);
					});
					break;
				case 'indexedDb':
					try {
						import('./indexedDbStorage').then(({ IndexedDbStorage }) => {
							const connection = indexedDB.open(serviceId, 1);
							const uow = new IndexedDbStorage(connection);
							callback(null, uow);
						});
					} catch (ex) {
						throw ex;
					}
					break;
				case 'remote':
					import('./remoteStorage').then(({ RemoteStorage }) => {
						const storage = new RemoteStorage(null);
						callback(null, storage);
					});
			}
			next();
		});
	}
}

export { DataStorage };
