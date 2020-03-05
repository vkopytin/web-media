import { utils } from 'databindjs';
import { IStorage } from './iStorage';


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
	static async create(callback: { (err, result: IStorage): void }) {
		switch (config.dbType) {
			case 'inMemory':
				const { InMemoryStorage } = await import('./inMemoryStorage');
				const uow = new InMemoryStorage(null);
				await callback(null, uow);
				break;
			case 'indexedDb':
				try {
					const { IndexedDbStorage } = await import('./indexedDbStorage');
					const connection = indexedDB.open(serviceId, 5);
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
	}
}

export { DataStorage };
