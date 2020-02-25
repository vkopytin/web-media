class ArtistData {
    uow = null;
    tableName = 'artists';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	each(callback: { (err, result?): void }) {
        this.uow.list(this.tableName, callback);
	}

	getById(artistId: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, artistId, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(artist, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, artist, callback);
	}

	update(artistId: string, artist, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, artistId, artist, callback);
	}

	delete(artistId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, artistId, callback);
    }
    
    refresh(artistId: string, artist, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, artistId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(artistId, {
                    ...record,
                    ...artist
                }, callback);
            } else {
                this.create(artist, callback);
            }
        });
    }
}

export { ArtistData };
