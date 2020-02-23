import * as React from 'react';
import { template } from '../templates/app';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import { AppViewModel, TrackViewModelItem } from '../viewModels';
import * as _ from 'underscore';
import { IDevice, IUserInfo } from '../service/adapter/spotify';
import { current } from '../utils';
import { ServiceResult } from '../base/serviceResult';
import { TokenExpiredError } from '../service/errors/tokenExpiredError';


export interface IAppViewProps {

}

class AppView extends withEvents(React.Component)<IAppViewProps, {}> {
    state = {
        openLogin: false,
        transition: ['', ''],
        prevPanel: 'home',
        currentPanel: 'home' as 'home' | 'playlists' | 'releases' | 'search' | 'tracks',
        showSelectDevices: 'hide' as 'show' | 'hide' | '',
        devices: [] as IDevice[],
        profile: {} as IUserInfo,
        scrolledToBottom: false,
        errors: [] as ServiceResult<any, Error>[],
        currentTrackId: '',
        topTracks: [] as TrackViewModelItem[]
    };
    elScroller = null as HTMLElement;
    onPageScroll = _.debounce(evnt => this.onPageScrollInternal(evnt), 500);

    binding = bindTo(this, () => current(AppViewModel), {
        'prop(openLogin)': 'openLogin',
        'prop(currentPanel)': 'currentPanel',
        'prop(devices)': 'devices',
        'prop(profile)': 'profile',
        'errors': 'errors',
        'prop(currentTrackId)': 'currentTrackId',
        'prop(topTracks)': 'topTracks'
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

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.prop('errors')) {
            this.prop('errors', val);
            this.showErrors(val);
        }

        return this.prop('errors');
    }

    openDevices(show) {
        this.toggleSelectDevices(show ? 'hide' : 'show');
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
        const tokenExpired = _.filter(errors, err => err.is(TokenExpiredError));
        if (!_.isEmpty(tokenExpired)) {
            this.prop('openLogin', true);
        }
    }

    isPlaying(track: TrackViewModelItem) {
        return this.prop('currentTrackId') === track.id();
    }

    render() {
        return template(this);
    }
}

export { AppView };
