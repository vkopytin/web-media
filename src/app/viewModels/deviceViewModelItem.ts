import { ViewModel } from '../base/viewModel';
import * as _ from 'underscore';
import { IDevice } from '../adapter/spotify';


class DeviceViewModelItem extends ViewModel {
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
