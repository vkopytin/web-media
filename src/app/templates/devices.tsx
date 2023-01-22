import * as _ from 'underscore';
import { DevicesView } from '../views/devicesView';

const ListDevices = ({ view }: { view: DevicesView }) => <>
    {_.map(view.devices, (device) => {
        return <li key={device.id()} className="table-view-cell"
            onClick={() => view.switchDevice(device)}
        >
            {device.name()}
            {device.isActive() ? <span>&nbsp;*</span> : ''}
        </li>
    })}
</>;

const EmptyDevices = ({ view }: { view: DevicesView }) => <>
    <li className="table-view-cell" style={{ padding: '11px 15px 11px 15px' }}>
        <label>Not Found</label>
        <label className="chips chips-positive pull-right">
            <a href="#" onClick={() => view.refreshDevicesCommand.exec()}>Click to refresh</a>
        </label>
    </li>
</>;

export const template = (view: DevicesView) => <ul className="table-view">
    {view.devices.length
        ? <ListDevices view={view} />
        : <EmptyDevices view={view} />
    }
</ul>;
