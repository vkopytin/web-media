import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/home';
import { Binding, current } from '../utils';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';

export interface IHomeViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class HomeView extends React.Component<IHomeViewProps> {
    vm = current(HomeViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();

    likedTracks$ = this.vm.likedTracks$;
    @Binding likedTracks = this.likedTracks$.getValue();

    isLoading$ = this.vm.isLoading$;
    @Binding isLoading = this.isLoading$.getValue();

    selectedTrack$ = this.vm.selectedTrack$;
    @Binding selectedTrack = this.selectedTrack$.getValue();

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding trackLyrics = this.trackLyrics$.getValue();

    refreshCommand$ = this.vm.refreshCommand$;
    @Binding refreshCommand = this.refreshCommand$.getValue();

    selectTrackCommand$ = this.vm.selectTrackCommand$;
    @Binding selectTrackCommand = this.selectTrackCommand$.getValue();

    likeTrackCommand$ = this.vm.likeTrackCommand$;
    @Binding likeTrackCommand = this.likeTrackCommand$.getValue();

    unlikeTrackCommand$ = this.vm.unlikeTrackCommand$;
    @Binding unlikeTrackCommand = this.unlikeTrackCommand$.getValue();

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding findTrackLyricsCommand = this.findTrackLyricsCommand$.getValue();

    dispose$ = new Subject<void>();
    queue$: Subscription;

    componentDidMount() {
        this.queue$ = merge(
            this.tracks$.pipe(map(tracks => ({ tracks }))),
            this.likedTracks$.pipe(map(likedTracks => ({ likedTracks }))),
            this.selectedTrack$.pipe(map(selectedTrack => [{ selectedTrack }])),
            this.trackLyrics$.pipe(map(trackLyrics => ({ trackLyrics }))),
            this.isLoading$.pipe(map(isLoading => ({ isLoading }))),
            this.refreshCommand$.pipe(map(refreshCommand => ({ refreshCommand }))),
            this.selectTrackCommand$.pipe(map(selectTrackCommand => ({ selectTrackCommand }))),
            this.likeTrackCommand$.pipe(map(likeTrackCommand => ({ likeTrackCommand }))),
            this.unlikeTrackCommand$.pipe(map(unlikeTrackCommand => ({ unlikeTrackCommand }))),
            this.findTrackLyricsCommand$.pipe(map(findTrackLyricsCommand => ({ findTrackLyricsCommand }))),
            this.errors$.pipe(map(errors => ({ errors }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
            //console.log(v)
            this.setState({
                ...this.state
            });
        });
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { HomeView };

