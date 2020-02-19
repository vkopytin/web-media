import * as React from 'react';
import { template } from '../templates/devices';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import { AppViewModel } from '../viewModels/appViewModel';
import { current } from '../utils';
import { DeviceViewModelItem } from '../viewModels/deviceViewModelItem';


export interface IDevicesViewProps {

}

class DevicesView extends withEvents(React.Component)<IDevicesViewProps, {}> {
    state = {
        devices: [] as DeviceViewModelItem[],
        currentDevice: null as DeviceViewModelItem
    };

    currentDeviceCommand = {
        exec(device: DeviceViewModelItem) { }
    };

    binding = bindTo(this, () => current(AppViewModel), {
        'prop(devices)': 'devices',
        'currentDeviceCommand': 'currentDeviceCommand',
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

    prop<K extends keyof DevicesView['state']>(propName: K, val?: DevicesView['state'][K]): DevicesView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    render() {
        return template(this);
    }
}

export { DevicesView };
