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
    vm = current(AppViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    switchDeviceCommand$ = this.vm.switchDeviceCommand$;
    @Binding switchDeviceCommand = this.switchDeviceCommand$.getValue();

    devices$ = this.vm.devices$;
    @Binding devices: DeviceViewModelItem[] = this.devices$.getValue();

    currentDevice$ = this.vm.currentDevice$;
    @Binding currentDevice = this.currentDevice$.getValue();

    dispose$ = new Subject<void>();
    queue$: Subscription;

    componentDidMount() {
        this.queue$ = merge(
            this.switchDeviceCommand$.pipe(map(switchDeviceCommand => ({ switchDeviceCommand }))),
            this.devices$.pipe(map(devices => ({ devices }))),
            this.currentDevice$.pipe(map(currentDevice => ({ currentDevice }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
            //console.log(v);
            this.setState({
                ...this.state
            });
        });
        this.errors$.pipe(
            takeUntil(this.dispose$),
            map(errors => this.showErrors(errors))
        ).subscribe();
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
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

