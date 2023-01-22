import { IDevice } from '../adapter/spotify';

class DeviceViewModelItem {
    constructor(public device: IDevice) {

    }

    id() {
        return this.device.id;
    }

    name() {
        return this.device.name;
    }

    isActive() {
        return this.device.is_active;
    }
}

export { DeviceViewModelItem };

