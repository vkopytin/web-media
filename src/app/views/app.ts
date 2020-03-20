import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import * as _ from 'underscore';
import { IDevice, IUserInfo } from '../adapter/spotify';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { TokenExpiredError } from '../service/errors/tokenExpiredError';
import { template } from '../templates/app';
import { current } from '../utils';
import { AppViewModel, TrackViewModelItem, DeviceViewModelItem } from '../viewModels';


export interface IAppViewProps {

}

class AppView extends BaseView<IAppViewProps, AppView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        openLogin: false,
        transition: ['', ''],
        prevPanel: 'home',
        currentPanel: 'home' as 'home' | 'playlists' | 'releases' | 'search' | 'tracks',
        showSelectDevices: 'hide' as 'show' | 'hide' | '',
        devices: [] as IDevice[],
        currentDevice: null as DeviceViewModelItem,
        profile: {} as IUserInfo,
        scrolledToBottom: false,
        currentTrackId: '',
        topTracks: [] as TrackViewModelItem[]
    };
    elScroller = null as HTMLElement;
    onPageScroll = _.debounce(evnt => this.onPageScrollInternal(evnt), 500);

    binding = bindTo(this, () => current(AppViewModel), {
        '-errors': 'errors',
        'prop(openLogin)': 'openLogin',
        'prop(currentPanel)': 'currentPanel',
        'prop(devices)': 'devices',
        'prop(profile)': 'profile',
        'prop(currentTrackId)': 'currentTrackId',
        'prop(topTracks)': 'topTracks',
        'prop(currentDevice)': 'currentDevice'
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

    openDevices(show) {
        this.toggleSelectDevices(show ? 'hide' : 'show');
    }

    isPlaying(track: TrackViewModelItem) {
        return this.prop('currentTrackId') === track.id();
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
        const tokenExpired = _.filter(errors, err => err.is(TokenExpiredError));
        if (!_.isEmpty(tokenExpired)) {
            this.prop('openLogin', true);
        }
        if (errors.length) {
            console.log(errors);
        }
        this.prop('errors', [...this.prop('errors'), ...errors]);
    }

    render() {
        return template(this);
    }
}

export { AppView };

