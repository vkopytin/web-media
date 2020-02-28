export interface IDeviceData {

}

class DeviceData {
    uow = null;
    tableName = 'devices';

	constructor(uow) {
        this.uow = uow;
        this.uow.createTable(this.tableName, () => { });
	}

	each(callback: { (err, result?: IDeviceData): void }) {
        this.uow.each(this.tableName, callback);
	}

	getById(deviceId, callback: { (err, result?: IDeviceData): void }) {
        this.uow.getById(this.tableName, deviceId, callback);
    }

	getCount(callback: { (err, result?: number): void }) {
        this.uow.getCount(this.tableName, callback);
	}

	create(device: IDeviceData, callback: { (err, result?): void }) {
        this.uow.create(this.tableName, device, callback);
	}

	update(deviceId, device: IDeviceData, callback: { (err, result?): void }) {
		this.uow.update(this.tableName, deviceId, device, callback);
	}

	delete(deviceId, callback: { (err, result?): void }) {
        this.uow.delete(this.tableName, deviceId, callback);
    }

    refresh(deviceId, device: IDeviceData, callback: { (err, result?): void }) {
        this.uow.getById(this.tableName, deviceId, (err, record) => {
            if (err) {
                return callback(err);
            }
            if (record) {
                this.update(deviceId, {
                    ...record,
                    ...device
                }, callback);
            } else {
                this.create(device, callback);
            }
        });
    }
}

export { DeviceData };
