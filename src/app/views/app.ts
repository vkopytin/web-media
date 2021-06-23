import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BehaviorSubject, merge, of, Subject, Subscription } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';
import { IDevice, IUserInfo } from '../adapter/spotify';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { TokenExpiredError } from '../service/errors/tokenExpiredError';
import { template } from '../templates/app';
import { current } from '../utils';
import { AppViewModel, TrackViewModelItem, DeviceViewModelItem } from '../viewModels';
import { Binding } from '../utils';

export interface IAppViewProps {

}

class AppView extends BaseView<IAppViewProps, AppView['state']> {
    vm = current(AppViewModel);

    openLogin$ = this.vm.openLogin$;
    @Binding openLogin = this.openLogin$.getValue();

    currentPanel$ = this.vm.currentPanel$;
    @Binding currentPanel = this.currentPanel$.getValue();

    devices$ = this.vm.devices$;
    @Binding devices = this.devices$.getValue();

    profile$ = this.vm.profile$;
    @Binding profile = this.profile$.getValue();

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding currentTrackId = this.currentTrackId$.getValue();
    
    topTracks$ = this.vm.topTracks$;
    @Binding topTracks = this.topTracks$.getValue();

    currentDevice$ = this.vm.currentDevice$;
    @Binding currentDevice = this.currentDevice$.getValue();

    refreshDevicesCommand$ = this.vm.refreshDevicesCommand$;
    @Binding refreshDevicesCommand = this.refreshDevicesCommand$.getValue();

    refreshTokenCommand$ = this.vm.refreshTokenCommand$;
    @Binding refreshTokenCommand = this.refreshTokenCommand$.getValue();

    autoRefreshUrl$ = this.vm.autoRefreshUrl$;
    @Binding autoRefreshUrl = this.autoRefreshUrl$.getValue();

    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    state = {
        errors: [] as ServiceResult<any, Error>[],
        transition: ['', ''],
        prevPanel: 'home',
        showSelectDevices: 'hide' as 'show' | 'hide' | '',
        devices: [] as IDevice[],
        scrolledToBottom: false
    };
    elScroller = null as HTMLElement;
    onPageScroll = _.debounce(evnt => this.onPageScrollInternal(evnt), 500);

    dispose$ = new Subject<void>();
    queue$: Subscription;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.queue$ = merge(
            this.openLogin$.pipe(map(openLogin => ({ openLogin }))),
            this.currentPanel$.pipe(map(currentPanel => ({ currentPanel }))),
            this.devices$.pipe(map(devices => ({ devices }))),
            this.profile$.pipe(map(profile => ({ profile }))),
            this.currentTrackId$.pipe(map(currentTrackId => ({ currentTrackId }))),
            this.topTracks$.pipe(map(topTracks => ({ topTracks }))),
            this.currentDevice$.pipe(map(currentDevice => ({ currentDevice }))),
            this.autoRefreshUrl$.pipe(map(autoRefreshUrl => ({ autoRefreshUrl }))),
            this.errors$.pipe(map(errors => ({ errors }))),
            this.refreshDevicesCommand$.pipe(map(refreshDevicesCommand => ({ refreshDevicesCommand }))),
            this.refreshTokenCommand$.pipe(map(refreshTokenCommand => ({ refreshTokenCommand }))),
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
        const tokenExpired = _.filter(errors, err => err.is(TokenExpiredError));
        if (!_.isEmpty(tokenExpired)) {
            this.openLogin = true;
            this.refreshTokenCommand.exec();
        }
        if (errors.length) {
            console.log(errors);
        }
        this.prop('errors', errors);
    }

    clearErrors(evnt) {
        evnt && evnt.preventDefault();
        this.setState({
            ...this.state,
            errors: []
        });
    }

    render() {
        return template(this);
    }
}

export { AppView };
