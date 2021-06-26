import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/myTracks';
import { Binding, current } from '../utils';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';

export interface IMyTracksViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    loadMore?: boolean;
    currentTrackId: string;
}

class MyTracksView extends React.Component<IMyTracksViewProps> {
    vm = current(MyTracksViewModel);

    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();

    likedTracks$ = this.vm.likedTracks$;
    @Binding likedTracks = [] as TrackViewModelItem[];

    isLoading$ = this.vm.isLoading$;
    @Binding isLoading = this.isLoading$.getValue();

    selectedItem$ = this.vm.selectedItem$;
    @Binding selectedItem = this.selectedItem$.getValue();

    trackLyrics$ = this.vm.trackLyrics$;
    @Binding trackLyrics = this.trackLyrics$.getValue();

    state = {
        term: '',
    };

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding loadMoreCommand = this.loadMoreCommand$.getValue();

    findTrackLyricsCommand$ = this.vm.findTrackLyricsCommand$;
    @Binding findTrackLyricsCommand = this.findTrackLyricsCommand$.getValue();

    dispose$: Subject<void>;
    disposeSubscription: Subscription;

    componentDidMount() {
        this.dispose$ = new Subject<void>();
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.tracks$.pipe(map(tracks => ({ tracks }))),
            this.likedTracks$.pipe(map(likedTracks => ({ likedTracks }))),
            this.isLoading$.pipe(map(isLoading => ({ isLoading }))),
            this.trackLyrics$.pipe(map(trackLyrics => ({ trackLyrics }))),
            this.selectedItem$.pipe(map(selectedItem => ({ selectedItem }))),
            this.loadMoreCommand$.pipe(map(loadMoreCommand => ({ loadMoreCommand }))),
            this.findTrackLyricsCommand$.pipe(map(findTrackLyricsCommand => ({ findTrackLyricsCommand }))),
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

    componentDidUpdate(prevProps: IMyTracksViewProps, prevState, snapshot) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
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

export { MyTracksView };

