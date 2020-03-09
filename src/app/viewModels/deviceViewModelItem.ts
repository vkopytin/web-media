import { IDevice } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';


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

