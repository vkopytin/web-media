class ImageData {
    uow = null;
    tableName = 'images';

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

	create(image, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, {
            id: image.url,
            ...image
        }, callback);
	}

	update(imageUrl: string, image, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, imageUrl, image, callback);
	}

	delete(imageUrl: string, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, imageUrl, callback);
    }

    refresh(imageUrl: string, image, callback: { (err, result?): void }) {
        this.getById(imageUrl, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(imageUrl, {
                    ...record,
                    ...image
                }, callback);
            } else {
                this.create(image, callback);
            }
        });
    }
}

export { ImageData };
