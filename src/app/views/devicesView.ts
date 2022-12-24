import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/devices';
import { Binding, current, Notifications } from '../utils';
import { AppViewModel } from '../viewModels';

export interface IDevicesViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    openShowDevices(showHide);
}

class DevicesView extends React.Component<IDevicesViewProps> {
    didRefresh: DevicesView['refresh'] = this.refresh.bind(this);
    vm = current(AppViewModel);

    errors$ = this.vm.errors$;
    @Binding({ didSet: (view, errors) => view.showErrors(errors) })
    errors: DevicesView['vm']['errors'];

    switchDeviceCommand$ = this.vm.switchDeviceCommand$;
    @Binding()
    switchDeviceCommand: DevicesView['vm']['switchDeviceCommand'];

    devices$ = this.vm.devices$;
    @Binding()
    devices: DevicesView['vm']['devices'];

    currentDevice$ = this.vm.currentDevice$;
    @Binding()
    currentDevice: DevicesView['vm']['currentDevice'];

    refreshDevicesCommand$ = this.vm.refreshDevicesCommand$;
    @Binding()
    refreshDevicesCommand: DevicesView['vm']['refreshDevicesCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(args) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
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

