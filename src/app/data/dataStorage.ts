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
	static dbType = config.dbType;

	static async create(callback: { (err: Error | null, result: IStorage | null): void }, dbType = DataStorage.dbType) {
		switch (dbType) {
			case 'inMemory':
				const { InMemoryStorage } = await import('./inMemoryStorage');
				const uow = new InMemoryStorage('');
				await callback(null, uow);
				break;
			case 'indexedDb':
				try {
					const { IndexedDbStorage } = await import('./indexedDbStorage');
					const connection = indexedDB.open(serviceId, 18);
					const uow = new IndexedDbStorage(connection);
					await callback(null, uow);

				} catch (ex) {
					await callback(ex as Error, null);
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
