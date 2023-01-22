import React from 'react';
import * as _ from 'underscore';
import { NoActiveDeviceError } from '../service/errors/noActiveDeviceError';
import { TokenExpiredError } from '../service/errors/tokenExpiredError';
import { template } from '../templates/app';
import { asyncDebounce, Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { AppViewModel, DeviceViewModelItem, TrackViewModelItem } from '../viewModels';

export interface IAppViewProps {

}

class AppView extends React.Component<IAppViewProps> {
    didRefresh: AppView['refresh'] = this.refresh.bind(this);
    vm = inject(AppViewModel);

    @Binding((a: AppView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: Result[];

    @Binding((a: AppView) => a.vm, 'openLogin')
    openLogin!: boolean;

    @Binding((a: AppView) => a.vm, 'currentPanel')
    currentPanel!: AppView['vm']['currentPanel'];

    @Binding((a: AppView) => a.vm, 'devices')
    devices!: DeviceViewModelItem[];

    @Binding((a: AppView) => a.vm, 'profile')
    profile!: AppView['vm']['profile'];

    @Binding((a: AppView) => a.vm, 'currentTrackId')
    currentTrackId!: AppView['vm']['currentTrackId'];

    @Binding((a: AppView) => a.vm, 'topTracks')
    topTracks!: AppView['vm']['topTracks'];

    @Binding((a: AppView) => a.vm, 'currentDevice')
    currentDevice!: AppView['vm']['currentDevice'];

    @Binding((a: AppView) => a.vm, 'refreshDevicesCommand')
    refreshDevicesCommand!: AppView['vm']['refreshDevicesCommand'];

    @Binding((a: AppView) => a.vm, 'refreshTokenCommand')
    refreshTokenCommand!: AppView['vm']['refreshTokenCommand'];

    @Binding((a: AppView) => a.vm, 'autoRefreshUrl')
    autoRefreshUrl!: AppView['vm']['autoRefreshUrl'];

    @Binding((a: AppView) => a.vm, 'isSyncing')
    isSyncing!: AppView['vm']['isSyncing'];

    state = {
        prevPanel: 'home',
        showSelectDevices: 'hide' as 'show' | 'hide' | '',
        scrolledToBottom: false
    };
    elScroller = null as HTMLElement | null;
    onPageScroll = asyncDebounce(() => this.onPageScrollInternal(), 500);

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

    openDevices(show: 'show' | 'hide' | boolean) {
        this.toggleSelectDevices(show ? 'hide' : 'show');
        if (show === 'show') {
            this.refreshDevicesCommand.exec();
        }
    }

    isPlaying(track: TrackViewModelItem) {
        return this.currentTrackId === track.id();
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
        }, 100);
    }

    onPageScrollInternal() {
        const scrollThreshold = 15,
            distance = this.getBottomDistance();
        if (distance <= scrollThreshold) {
            this.state.scrolledToBottom || this.setState({
                ...this.state,
                scrolledToBottom: true
            }, () => {
                this.setState({
                    ...this.state,
                    scrolledToBottom: false
                });
            });
        }
    }

    getBottomDistance() {
        const elementScroll = this.elScroller;
        if (elementScroll) {
            return this.getElementBottomDistance();
        }
        return 0;
    }

    getElementBottomDistance() {
        if (!this.elScroller) {
            return 0;
        }
        const scroller = this.elScroller,
            bottom = scroller?.scrollHeight,
            scrollY = scroller.scrollTop + scroller.clientHeight;
        return bottom - scrollY;
    }

    showErrors(errors: Result<Error, unknown>[]) {
        if (_.isEmpty(errors)) {
            return;
        }
        const tokenExpired = _.filter(errors, err => err.is(TokenExpiredError));
        const activeDevice = _.filter(errors, err => err.is(NoActiveDeviceError));

        if (!_.isEmpty(tokenExpired)) {
            this.errors = _.filter(errors, err => !err.is(TokenExpiredError));
            this.openLogin = true;
            setTimeout(() => this.refreshTokenCommand.exec());
            return;
        }

        if (!_.isEmpty(activeDevice)) {
            this.errors = _.filter(errors, err => !err.is(NoActiveDeviceError));
            setTimeout(() => this.toggleSelectDevices('hide'));
            return;
        }
        this.errors = errors;
    }

    clearErrors(evnt: React.MouseEvent<HTMLElement, MouseEvent>) {
        evnt && evnt.preventDefault();
        this.errors = [];
    }

    render() {
        return template(this);
    }
}

export { AppView };
