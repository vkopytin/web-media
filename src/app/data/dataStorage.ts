const serviceId = 'spotify-data-storage';
const config = {
    DbType: 'inMemory'
};

// Unit of Work Factory
class DataStorage {
	static create(callback: { (err, result): void }) {
		switch (config.DbType) {
			case 'inMemory':
				const { InMemoryStorage } = require('./inMemoryStorage');
				const uow = new InMemoryStorage();

				return callback(null, uow);
			case 'indexedDB':
				try {
					const { IndexedDbStorage } = require('./indexedDbStorage');
					const connection = indexedDB.open(serviceId, 1);
					const uow = new IndexedDbStorage(connection);
					return callback(null, uow);
				} catch (ex) {
					throw ex;
				}
				break;
		}
	}
}

export { DataStorage };
