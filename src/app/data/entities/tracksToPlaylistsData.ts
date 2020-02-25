class TracksPlaylistsData {
    uow = null;
    tableName = 'tracksToplaylists';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
    }

    getId(trackId: string, playlistId: string) {
        return `${trackId}-${playlistId}`;
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

    create(trackId: string, playlistId: string, callback: { (err, result?): void }) {
        const id = this.getId(trackId, playlistId);
        this.uow.create(this.tableName, {
            id,
            trackId,
            playlistId
        }, callback);
	}

    update(trackId: string, playlistId: string, callback: { (err, result?): void }) {
        const id = this.getId(trackId, playlistId);
        this.uow.update(this.tableName, id, {
            id,
            trackId,
            playlistId
        }, callback);
	}

	delete(id: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, id, callback);
    }

    refresh(trackId: string, playlistId: string, callback: { (err, result?): void }) {
        const id = this.getId(trackId, playlistId);
        this.getById(id, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(trackId, playlistId , callback);
            } else {
                this.create(trackId, playlistId, callback);
            }
        });
    }
}

export { TracksPlaylistsData };
