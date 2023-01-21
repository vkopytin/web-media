import React from 'react';
import { template } from '../templates/devices';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AppViewModel, DeviceViewModelItem } from '../viewModels';

export interface IDevicesViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    openShowDevices(showHide: boolean): void;
}

class DevicesView extends React.Component<IDevicesViewProps> {
    didRefresh: DevicesView['refresh'] = this.refresh.bind(this);
    vm = inject(AppViewModel);

    @Binding((a: DevicesView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: DevicesView['vm']['errors'];

    @Binding((a: DevicesView) => a.vm, 'switchDeviceCommand')
    switchDeviceCommand!: DevicesView['vm']['switchDeviceCommand'];

    @Binding((a: DevicesView) => a.vm, 'devices')
    devices!: DevicesView['vm']['devices'];

    @Binding((a: DevicesView) => a.vm, 'currentDevice')
    currentDevice!: DevicesView['vm']['currentDevice'];

    @Binding((a: DevicesView) => a.vm, 'refreshDevicesCommand')
    refreshDevicesCommand!: DevicesView['vm']['refreshDevicesCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    async switchDevice(device: DeviceViewModelItem) {
        await this.switchDeviceCommand.exec(device);
        this.props.openShowDevices(false);
    }

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { DevicesView };

