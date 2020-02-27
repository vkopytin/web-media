class ArtistsToTracksData {
    uow = null;
    tableName = 'artistsToTracks';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
    }

    getId(artistId: string, trackId: string) {
        return `${artistId}-${trackId}`;
    }

	each(callback: { (err, result?): void }) {
        this.uow.each(this.tableName, callback);
	}

    getById(id: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, id, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(artistId: string, trackId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, trackId);
        this.uow.create(this.tableName, {
            id,
            artistId,
            trackId
        }, callback);
	}

    update(artistId: string, trackId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, trackId);
        this.uow.update(this.tableName, id, {
            id,
            artistId,
            trackId
        }, callback);
	}

	delete(artistsToTracskId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, artistsToTracskId, callback);
    }
    
    refresh(artistId: string, trackId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, trackId);
        this.uow.getById(this.tableName, id, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(artistId, trackId , callback);
            } else {
                this.create(artistId, trackId, callback);
            }
        });
    }
}

export { ArtistsToTracksData };