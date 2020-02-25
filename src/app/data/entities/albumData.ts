class AlbumData {
    uow = null;
    tableName = 'albums';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	getAll(callback: { (err, result?): void }) {
        this.uow.list(this.tableName, callback);
	}

	getById(albumId, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, albumId, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(album, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, album, callback);
	}

	update(albumId, album, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, albumId, album, callback);
	}

	delete(albumId, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, albumId, callback);
    }

    refresh(albumId, album, callback: { (err, result?): void }) {
        this.getById(albumId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(albumId, {
                    ...record,
                    ...album
                }, callback);
            } else {
                this.create(album, callback);
            }
        });
    }
}

export { AlbumData };
