class MyLibraryData {
    uow = null;
    tableName = 'myLibrary';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
    }

	getAll(callback: { (err, result?): void }) {
        this.uow.list(this.tableName, callback);
	}

    getById(id: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, id, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(id: string, library, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, {
            id,
            ...library
        }, callback);
	}

    update(id: string, library, callback: { (err, result?): void }) {
        this.uow.update(this.tableName, id, {
            id,
            ...library
        }, callback);
	}

	delete(id: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, id, callback);
    }

    refresh(id: string, library, callback: { (err, result?): void }) {
        this.getById(id, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(id, library , callback);
            } else {
                this.create(id, library, callback);
            }
        });
    }
}

export { MyLibraryData };
