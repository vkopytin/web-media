import * as _ from 'underscore';
import * as React from 'react';
import { DevicesView } from '../views/devicesView';


export const template = (view: DevicesView) => <ul className="table-view">
    {_.map(view.prop('devices'), (device) => {
        return <li key={device.id()} className="table-view-cell"
            onClick={evnt => view.switchDevice(device)}
        >
            {device.name()}
            {device.isActive() ? <span>&nbsp;*</span> : ''}
        </li>
    })}
</ul>;
