import React from 'react';
import { template } from '../templates/devices';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
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

    @Binding((a: DevicesView) => a.vm, 'devices')
    devices!: DeviceViewModelItem[];

    @Binding((a: DevicesView) => a.vm, 'currentDevice')
    currentDevice!: DeviceViewModelItem | null;

    @Binding((a: DevicesView) => a.vm, 'switchDeviceCommand')
    switchDeviceCommand!: ICommand<DeviceViewModelItem>;

    @Binding((a: DevicesView) => a.vm, 'refreshDevicesCommand')
    refreshDevicesCommand!: ICommand;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    async switchDevice(device: DeviceViewModelItem): Promise<void> {
        await this.switchDeviceCommand.exec(device);
        this.props.openShowDevices(false);
    }

    showErrors(errors: Result<Error>[]): void {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { DevicesView };

