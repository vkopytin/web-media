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
		return new Promise((resolve) => {
			queue.push(async next => {
				switch (config.dbType) {
					case 'inMemory':
						const { InMemoryStorage } = await import('./inMemoryStorage');
						const uow = new InMemoryStorage(null);
						await callback(null, uow);
						break;
					case 'indexedDb':
						try {
							const { IndexedDbStorage } = await import('./indexedDbStorage');
							const connection = indexedDB.open(serviceId, 2);
							const uow = new IndexedDbStorage(connection);
							await callback(null, uow);

						} catch (ex) {
							await callback(ex, null);
						}
						break;
					case 'remote':
						const { RemoteStorage } = await import('./remoteStorage');
						const storage = new RemoteStorage(null);
						await callback(null, storage);
				}
				resolve();
				next();
			});
		});
	}
}

export { DataStorage };
