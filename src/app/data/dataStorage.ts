const serviceId = 'spotify-data-storage';
const config = {
    DbType: 'inMemory'
};

// Unit of Work Factory
class DataStorage {
	static async create(callback) {
		switch (config.DbType) {
			case 'inMemory':
				const { InMemoryStorage } = require('./inMemoryStorage');
				const uow = new InMemoryStorage();

				return await callback(uow);
			case 'indexedDB':
				try {
					const { IndexedDbStorage } = require('./indexedDbStorage');
					const connection = indexedDB.open(serviceId, 1);
					const uow = new IndexedDbStorage(connection);
					return await callback(uow);
				} catch (ex) {
					throw ex;
				}
				break;
		}
	}
}

export { DataStorage };
