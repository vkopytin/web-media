import { IDevice } from '../ports/iRemotePlaybackPort';

class DeviceViewModelItem {
    static fromDevice(device: IDevice): DeviceViewModelItem {
        const inst = new DeviceViewModelItem(device);
        return inst;
    }
    constructor(public device: IDevice) {

    }

    id(): string {
        return this.device.id;
    }

    name(): string {
        return this.device.name;
    }

    isActive(): boolean {
        return this.device.is_active;
    }
}

export { DeviceViewModelItem };

