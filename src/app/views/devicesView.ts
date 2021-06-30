import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/devices';
import { Binding, current } from '../utils';
import { AppViewModel, DeviceViewModelItem } from '../viewModels';

export interface IDevicesViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    openShowDevices(showHide);
}

class DevicesView extends React.Component<IDevicesViewProps> {
    didRefresh: DevicesView['refresh'] = () => {};
    vm = current(AppViewModel);
    
    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: DevicesView['vm']['errors'];

    switchDeviceCommand$ = this.vm.switchDeviceCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    switchDeviceCommand: DevicesView['vm']['switchDeviceCommand'];

    devices$ = this.vm.devices$;
    @Binding({ didSet: (view) => view.didRefresh() })
    devices: DevicesView['vm']['devices'];

    currentDevice$ = this.vm.currentDevice$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentDevice: DevicesView['vm']['currentDevice'];

    componentDidMount() {
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        this.didRefresh = () => { };
    }

    refresh() {
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

