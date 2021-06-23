import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { merge, of, Subject, Subscription } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/devices';
import { current } from '../utils';
import { AppViewModel, DeviceViewModelItem } from '../viewModels';
import { Binding } from '../utils';
import * as _ from 'underscore';

export interface IDevicesViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    openShowDevices(showHide);
}

class DevicesView extends BaseView<IDevicesViewProps, DevicesView['state']> {
    vm = current(AppViewModel);
    
    state = {
        errors: [] as ServiceResult<any, Error>[],
        devices: [] as DeviceViewModelItem[],
    };

    switchDeviceCommand$ = this.vm.switchDeviceCommand$;
    @Binding switchDeviceCommand = this.switchDeviceCommand$.getValue();

    devices$ = this.vm.devices$;
    @Binding devices: DeviceViewModelItem[] = this.devices$.getValue();

    currentDevice$ = this.vm.currentDevice$;
    @Binding currentDevice = this.currentDevice$.getValue();

    dispose$ = new Subject<void>();
    queue$: Subscription;

    constructor(props) {
        super(props);
    }

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

