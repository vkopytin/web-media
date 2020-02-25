class AlbumToImagesData {
    uow = null;
    tableName = 'albumsToImages';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
    }

	getAll(callback: { (err, result?): void }) {
        this.uow.list(this.tableName, callback);
	}

    getById(imageUrl: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, imageUrl, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(imageUrl: string, albumId: string, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, {
            id: imageUrl,
            albumId
        }, callback);
	}

    update(imageUrl: string, albumId: string, callback: { (err, result?): void }) {
        this.uow.update(this.tableName, imageUrl, {
            id: imageUrl,
            albumId
        }, callback);
	}

	delete(imageUrl: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, imageUrl, callback);
    }
    
    refresh(imageUrl: string, albumId: string, callback: { (err, result?): void }) {
        this.getById(imageUrl, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(imageUrl, albumId, callback);
            } else {
                this.create(imageUrl, albumId, callback);
            }
        });
    }
}

export { AlbumToImagesData };
