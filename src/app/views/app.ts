import * as React from 'react';
import { template } from '../templates/app';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import { AppViewModel } from '../viewModels';
import * as _ from 'underscore';
import { IDevice, IUserInfo } from '../service/adapter/spotify';
import { current } from '../utils';


export interface IAppViewProps {

}

class AppView extends withEvents(React.Component)<IAppViewProps, {}> {
    state = {
        openLogin: false,
        transition: ['', ''],
        prevPanel: 'home',
        currentPanel: 'home' as 'home' | 'profile' | 'releases' | 'search',
        showSelectDevices: 'hide' as 'show' | 'hide' | '',
        devices: [] as IDevice[],
        profile: {} as IUserInfo
    };
    binding = bindTo(this, () => current(AppViewModel), {
        'prop(openLogin)': 'openLogin',
        'prop(currentPanel)': 'currentPanel',
        'prop(devices)': 'devices',
        'prop(profile)': 'profile'
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

    prop<K extends keyof AppView['state']>(propName: K, val?: AppView['state'][K]): AppView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    toggleSelectDevices(fromState?: 'show' | 'hide') {
        const lastValue = fromState || this.state.showSelectDevices;
        if (fromState && (fromState !== this.state.showSelectDevices)) {

            return;
        }

        this.setState(this.state = {
            ...this.state,
            showSelectDevices: ''
        });

        _.delay(() => {
            this.setState(this.state = {
                ...this.state,
                showSelectDevices: lastValue === 'show' ? 'hide' : 'show'
            });
        }, 500);
    }

    render() {
        return template(this);
    }
}

export { AppView };
