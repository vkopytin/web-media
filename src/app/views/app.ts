import React from 'react';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { NoActiveDeviceError } from '../service/errors/noActiveDeviceError';
import { TokenExpiredError } from '../service/errors/tokenExpiredError';
import { template } from '../templates/app';
import { Binding, current, Notifications } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel, TrackViewModelItem } from '../viewModels';
import { Core } from '../viewModels/core';

export interface IAppViewProps {

}

const core = new Core();

class AppView extends React.Component<IAppViewProps> {
    didRefresh: AppView['refresh'] = this.refresh.bind(this);
    vm = current(AppViewModel);

    errors$ = this.vm.errors$;
    @Binding<AppView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: AppView['vm']['errors'];

    openLogin$ = this.vm.openLogin$;
    @Binding()
    openLogin!: AppView['vm']['openLogin'];

    currentPanel$ = this.vm.currentPanel$;
    @Binding()
    currentPanel!: AppView['vm']['currentPanel'];

    devices$ = this.vm.devices$;
    @Binding()
    devices!: AppView['vm']['devices'];

    profile$ = this.vm.profile$;
    @Binding()
    profile!: AppView['vm']['profile'];

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding()
    currentTrackId!: AppView['vm']['currentTrackId'];

    topTracks$ = this.vm.topTracks$;
    @Binding()
    topTracks!: AppView['vm']['topTracks'];

    currentDevice$ = this.vm.currentDevice$;
    @Binding()
    currentDevice!: AppView['vm']['currentDevice'];

    refreshDevicesCommand$ = this.vm.refreshDevicesCommand$;
    @Binding()
    refreshDevicesCommand!: AppView['vm']['refreshDevicesCommand'];

    refreshTokenCommand$ = this.vm.refreshTokenCommand$;
    @Binding()
    refreshTokenCommand!: AppView['vm']['refreshTokenCommand'];

    autoRefreshUrl$ = this.vm.autoRefreshUrl$;
    @Binding()
    autoRefreshUrl!: AppView['vm']['autoRefreshUrl'];

    isSyncing$ = this.vm.isSyncing$;
    @Binding()
    isSyncing!: AppView['vm']['isSyncing'];

    state = {
        prevPanel: 'home',
        showSelectDevices: 'hide' as 'show' | 'hide' | '',
        scrolledToBottom: false
    };
    elScroller = null as HTMLElement | null;
    onPageScroll = _.debounce(() => this.onPageScrollInternal(), 500);

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(args: { inst: AppView['errors$']; value: ServiceResult<unknown, Error>[] }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
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

    showErrors(errors: ServiceResult<any, Error>[]) {
        if (_.isEmpty(errors)) {
            return;
        }
        const tokenExpired = _.filter(errors, err => err.is(TokenExpiredError));
        const activeDevice = _.filter(errors, err => err.is(NoActiveDeviceError));

        if (!_.isEmpty(tokenExpired)) {
            this.errors = _.filter(errors, err => !err.is(TokenExpiredError));
            this.openLogin = true;
            console.log('running tasks:', Scheduler.getCurrent().inProgress);
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
