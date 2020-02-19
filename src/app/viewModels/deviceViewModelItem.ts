import { Events } from 'databindjs';
import * as _ from 'underscore';
import { IDevice } from '../service/adapter/spotify';


class DeviceViewModelItem extends Events {
    constructor(public device: IDevice) {
        super();
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
