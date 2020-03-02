import { utils } from 'databindjs';


export interface IDeviceData {
    updatedTs: number;
    syncTs: number;
}

class DeviceData {
    uow = null;
    tableName = 'devices';

	constructor(uow) {
        this.uow = uow;
    }
    
    createTable(cb: { (err, result): void }) {
        this.uow.createTable(this.tableName, cb);
    }

    each(callback: { (err, result?: IDeviceData, index?: number): void }) {
        const queue = utils.asyncQueue();
        this.uow.each(this.tableName, (err, result, index) => {
            queue.push(next => {
                callback(err, result, index);
                next();
            });
        });
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
