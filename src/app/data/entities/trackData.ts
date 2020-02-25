class TrackData {
    uow = null;
    tableName = 'tracks';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	getAll(callback: { (err, result?): void }) {
        this.uow.list(this.tableName, callback);
	}

	getById(trackId: string, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, trackId, callback);
    }

	getCount(callback: { (err, result?): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(track, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, track, callback);
	}

	update(trackId: string, track, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, trackId, track, callback);
	}

	delete(trackId: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, trackId, callback);
    }
    
    refresh(trackId: string, track, callback: { (err, result?): void }) {
        this.getById(trackId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(trackId, {
                    ...record,
                    ...track
                }, callback);
            } else {
                this.create(track, callback);
            }
        });
    }
}

export { TrackData };
