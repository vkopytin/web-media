import { BaseView } from '../base/baseView';
import { template } from '../templates/devices';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    AppViewModel,
    DeviceViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface IDevicesViewProps {
    openShowDevices(showHide);
}

class DevicesView extends BaseView<IDevicesViewProps, DevicesView['state']> {
    state = {
        devices: [] as DeviceViewModelItem[],
        currentDevice: null as DeviceViewModelItem
    };

    switchDeviceCommand = {
        exec(device: DeviceViewModelItem) { }
    };

    binding = bindTo(this, () => current(AppViewModel), {
        'prop(devices)': 'devices',
        'switchDeviceCommand': 'switchDeviceCommand',
        'prop(currentDevice)': 'currentDevice'
    });

    constructor(props) {
        super(props);
        subscribeToChange(this.binding, () => {
            this.setState({
                ...this.state
            });
        });
    }

    componentDidMount() {
        updateLayout(this.binding);
    }

    componentWillUnmount() {
        unbindFrom(this.binding);
    }

    async switchDevice(device) {
        await this.switchDeviceCommand.exec(device);
        this.props.openShowDevices(false);
    }

    render() {
        return template(this);
    }
}

export { DevicesView };
