class PlaylistToImagesData {
    uow = null;
    tableName = 'playlistToImages';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
    }

	each(callback: { (err, result?): void }) {
        this.uow.each(this.tableName, callback);
	}

    getById(imageUrl: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, imageUrl, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(imageUrl: string, playlistId: string, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, {
            id: imageUrl,
            playlistId
        }, callback);
	}

    update(imageUrl: string, playlistId: string, callback: { (err, result?): void }) {
        this.uow.update(this.tableName, imageUrl, {
            id: imageUrl,
            playlistId
        }, callback);
	}

	delete(imageUrl: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, imageUrl, callback);
    }
    
    refresh(imageUrl: string, playlistId: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, imageUrl, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(imageUrl, playlistId, callback);
            } else {
                this.create(imageUrl, playlistId, callback);
            }
        });
    }
}

export { PlaylistToImagesData };
