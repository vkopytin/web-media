export interface IArtistsToAlbumsData {
    id: string;
    artistId: string;
    albumId: string;
}

class ArtistsToAlbumsData {
    uow = null;
    tableName = 'artistsToAlbums';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
    }

    getId(artistId: string, albumId: string) {
        return `${artistId}-${albumId}`;
    }

	each(callback: { (err, result?): void }) {
        this.uow.each(this.tableName, callback);
	}

    getById(id: string, callback: { (err, result?: IArtistsToAlbumsData): void }) {
        this.uow.getById(this.tableName, id, callback);
    }

	getCount(callback: { (err, result?: number): void }) {
        this.uow.getCount(this.tableName, callback);
	}

    create(artistId: string, albumId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, albumId);
        this.uow.create(this.tableName, {
            id,
            artistId,
            albumId
        }, callback);
	}

    update(artistId: string, albumId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, albumId);
        this.uow.update(this.tableName, id, {
            id,
            artistId,
            albumId
        }, callback);
	}

	delete(artistId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, artistId, callback);
    }
    
    refresh(artistId: string, albumId: string, callback: { (err, result?): void }) {
        const id = this.getId(artistId, albumId);
        this.uow.getById(this.tableName, id, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(artistId, albumId, callback);
            } else {
                this.create(artistId, albumId, callback);
            }
        });
    }
}

export { ArtistsToAlbumsData };
