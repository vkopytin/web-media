import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/devices';
import { current } from '../utils';
import { AppViewModel, DeviceViewModelItem } from '../viewModels';


export interface IDevicesViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    openShowDevices(showHide);
}

class DevicesView extends BaseView<IDevicesViewProps, DevicesView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        devices: [] as DeviceViewModelItem[],
        currentDevice: null as DeviceViewModelItem
    };

    switchDeviceCommand = {
        exec(device: DeviceViewModelItem) { }
    };

    binding = bindTo(this, () => current(AppViewModel), {
        'switchDeviceCommand': 'switchDeviceCommand',
        'prop(devices)': 'devices',
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { DevicesView };

