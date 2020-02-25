class PlaylistData {
    uow = null;
    tableName = 'playlists';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	getAll(callback: { (err, result?): void }) {
        this.uow.list(this.tableName, callback);
	}

	getById(playlistId: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, playlistId, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(playlist, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, playlist, callback);
	}

	update(playlistId: string, playlist, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, playlistId, playlist, callback);
	}

	delete(playlistId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, playlistId, callback);
    }
    
    refresh(playlistId: string, playlist, callback: { (err, result?): void }) {
        this.getById(playlistId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(playlistId, {
                    ...record,
                    ...playlist
                }, callback);
            } else {
                this.create(playlist, callback);
            }
        });
    }
}

export { PlaylistData };
