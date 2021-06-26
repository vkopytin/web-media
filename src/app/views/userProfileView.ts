import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/userProfile';
import { current } from '../utils';
import { TrackViewModelItem, UserProfileViewModel } from '../viewModels';
import { IUserInfo } from '../adapter/spotify';
import { BehaviorSubject, merge, of, Subject, Subscription } from 'rxjs';
import { Binding } from '../utils';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import React from 'react';


export interface IUserProfileViewProps {
    className?: string;
    showErrors(errors: ServiceResult<any, Error>[]);
    openLogin$: BehaviorSubject<boolean>;
}

class UserProfileView extends React.Component<IUserProfileViewProps> {
    vm = current(UserProfileViewModel);

    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    openLogin$ = this.props.openLogin$;
    @Binding openLogin = this.openLogin$.getValue();

    profile$ = this.vm.profile$;
    @Binding profile = this.profile$.getValue();

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding currentTrackId = this.currentTrackId$.getValue();

    topTracks$ = this.vm.topTracks$;
    @Binding topTracks = [] as TrackViewModelItem[];

    tracks$ = this.vm.tracks$;
    @Binding tracks = [] as TrackViewModelItem[];

    spotifyAuthUrl$ = this.vm.spotifyAuthUrl$;
    @Binding spotifyAuthUrl = this.spotifyAuthUrl$.getValue();

    geniusAuthUrl$ = this.vm.geniusAuthUrl$;
    @Binding geniusAuthUrl = this.geniusAuthUrl$.getValue();

    apiseedsKey$ = this.vm.apiseedsKey$;
    @Binding apiseedsKey = this.apiseedsKey$.getValue();

    dispose$: Subject<void>;
    disposeSubscription: Subscription;

    componentDidMount() {
        this.dispose$ = new Subject<void>();
        this.disposeSubscription = merge(
            this.openLogin$.pipe(map(openLogin => ({openLogin}))),
            this.profile$.pipe(map(profile => ({profile}))),
            this.currentTrackId$.pipe(map(currentTrackId => ({currentTrackId}))),
            this.topTracks$.pipe(map(topTracks => ({topTracks}))),
            this.tracks$.pipe(map(tracks => ({tracks}))),
            this.spotifyAuthUrl$.pipe(map(spotifyAuthUrl => ({spotifyAuthUrl}))),
            this.geniusAuthUrl$.pipe(map(geniusAuthUrl => ({geniusAuthUrl}))),
            this.apiseedsKey$.pipe(map(apiseedsKey => ({ apiseedsKey }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
            //console.log(v);
            this.setState({
                ...this.state
            });
        });
        this.errors$.pipe(
            takeUntil(this.dispose$),
            map(errors => this.showErrors(errors))
        ).subscribe();
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
    }

    isPlaying(track: TrackViewModelItem) {
        return this.currentTrackId === track.id();
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { UserProfileView };

