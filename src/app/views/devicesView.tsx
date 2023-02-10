import { useServiceMonitor } from 'app/hooks';
import { inject } from '../utils/inject';
import { ICommand } from '../utils/scheduler';
import { AppViewModel, DeviceViewModelItem } from '../viewModels';

export interface IDevicesViewProps {
    onSwitchDevice(): void;
    appViewModel?: AppViewModel;
}

const ListDevices = ({ devices, switchDevice }: { devices: DeviceViewModelItem[]; switchDevice(device: DeviceViewModelItem): void; }) => <>
    {devices.map((device) => {
        return <li key={device.id()} className="table-view-cell"
            onClick={() => switchDevice(device)}
        >
            {device.name()}
            {device.isActive() ? <span>&nbsp;*</span> : ''}
        </li>
    })}
</>;

const EmptyDevices = ({ refreshDevicesCommand }: { refreshDevicesCommand: ICommand }) => <>
    <li className="table-view-cell" style={{ padding: '11px 15px 11px 15px' }}>
        <label>Not Found</label>
        <label className="chips chips-positive pull-right">
            <a href="#" onClick={() => refreshDevicesCommand.exec()}>Click to refresh</a>
        </label>
    </li>
</>;

export const DevicesView = ({ onSwitchDevice, appViewModel = inject(AppViewModel) }: IDevicesViewProps) => {
    useServiceMonitor(appViewModel);

    const switchDevice = async (device: DeviceViewModelItem): Promise<void> => {
        await appViewModel.switchDeviceCommand.exec(device);
        onSwitchDevice();
    };

    return <ul className="table-view">
        {appViewModel.devices.length
            ? <ListDevices devices={appViewModel.devices} switchDevice={d => switchDevice(d)} />
            : <EmptyDevices refreshDevicesCommand={appViewModel.refreshDevicesCommand} />
        }
    </ul>;
};
