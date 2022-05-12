import React from 'react';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { NoActiveDeviceError } from '../service/errors/noActiveDeviceError';
import { TokenExpiredError } from '../service/errors/tokenExpiredError';
import { template } from '../templates/app';
import { Binding, current, Notify } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel, TrackViewModelItem } from '../viewModels';

export interface IAppViewProps {

}

class AppView extends React.Component<IAppViewProps> {
    didRefresh: AppView['refresh'] = () => { };
    vm = current(AppViewModel);

    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: AppView['vm']['errors'];

    openLogin$ = this.vm.openLogin$;
    @Binding({ didSet: (view) => view.didRefresh() })
    openLogin: AppView['vm']['openLogin'];

    currentPanel$ = this.vm.currentPanel$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentPanel: AppView['vm']['currentPanel'];

    devices$ = this.vm.devices$;
    @Binding({ didSet: (view) => view.didRefresh() })
    devices: AppView['vm']['devices'];

    profile$ = this.vm.profile$;
    @Binding({ didSet: (view) => view.didRefresh() })
    profile: AppView['vm']['profile'];

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding({ didSet: (view, currentTrackId) => view.didRefresh({ currentTrackId }) })
    currentTrackId: AppView['vm']['currentTrackId'];
    
    topTracks$ = this.vm.topTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    topTracks: AppView['vm']['topTracks'];

    currentDevice$ = this.vm.currentDevice$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentDevice: AppView['vm']['currentDevice'];

    refreshDevicesCommand$ = this.vm.refreshDevicesCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    refreshDevicesCommand: AppView['vm']['refreshDevicesCommand'];

    refreshTokenCommand$ = this.vm.refreshTokenCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    refreshTokenCommand: AppView['vm']['refreshTokenCommand'];

    autoRefreshUrl$ = this.vm.autoRefreshUrl$;
    @Binding({ didSet: (view) => view.didRefresh() })
    autoRefreshUrl: AppView['vm']['autoRefreshUrl'];

    isSyncing$ = this.vm.isSyncing$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isSyncing: AppView['vm']['isSyncing'];

    state = {
        transition: ['', ''],
        prevPanel: 'home',
        showSelectDevices: 'hide' as 'show' | 'hide' | '',
        scrolledToBottom: false
    };
    elScroller = null as HTMLElement;
    onPageScroll = _.debounce(evnt => this.onPageScrollInternal(evnt), 500);

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
    }

    refresh(args) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    openDevices(show) {
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

    onPageScrollInternal(evnt) {
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
    }

    getElementBottomDistance() {
        const scroller = this.elScroller,
            bottom = scroller.scrollHeight,
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

    clearErrors(evnt) {
        evnt && evnt.preventDefault();
        this.errors = [];
    }

    render() {
        return template(this);
    }
}

export { AppView };
