import React from 'react';
import { template } from '../templates/home';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';

export interface IHomeViewProps {
    currentTrackId: string;
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class HomeView extends React.Component<IHomeViewProps> {
    didRefresh: HomeView['refresh'] = this.refresh.bind(this);
    vm = inject(HomeViewModel);

    @Binding((a: HomeView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: Result[];

    @Binding((a: HomeView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: HomeView) => a.vm, 'likedTracks')
    likedTracks!: TrackViewModelItem[];

    @Binding((a: HomeView) => a.vm, 'isLoading')
    isLoading!: boolean;

    @Binding((a: HomeView) => a.vm, 'selectedTrack')
    selectedTrack!: TrackViewModelItem | null;

    @Binding((a: HomeView) => a.vm, 'trackLyrics')
    trackLyrics!: HomeView['vm']['trackLyrics'];

    @Binding((a: HomeView) => a.vm, 'bannedTrackIds')
    bannedTrackIds!: string[];

    @Binding((a: HomeView) => a.vm, 'refreshCommand')
    refreshCommand!: HomeView['vm']['refreshCommand'];

    @Binding((a: HomeView) => a.vm, 'selectTrackCommand')
    selectTrackCommand!: HomeView['vm']['selectTrackCommand'];

    @Binding((a: HomeView) => a.vm, 'likeTrackCommand')
    likeTrackCommand!: HomeView['vm']['likeTrackCommand'];

    @Binding((a: HomeView) => a.vm, 'unlikeTrackCommand')
    unlikeTrackCommand!: HomeView['vm']['unlikeTrackCommand'];

    @Binding((a: HomeView) => a.vm, 'findTrackLyricsCommand')
    findTrackLyricsCommand!: HomeView['vm']['findTrackLyricsCommand'];

    @Binding((a: HomeView) => a.vm, 'bannTrackCommand')
    bannTrackCommand!: HomeView['vm']['bannTrackCommand'];

    @Binding((a: HomeView) => a.vm, 'removeBannFromTrackCommand')
    removeBannFromTrackCommand!: HomeView['vm']['removeBannFromTrackCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem): boolean {
        return this.props.currentTrackId === track.id();
    }

    isBanned(track: TrackViewModelItem): boolean {
        const res = this.bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }

    showErrors(errors: Result<Error>[]): void {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { HomeView };

