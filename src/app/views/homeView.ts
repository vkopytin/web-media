import React from 'react';
import { template } from '../templates/home';
import { Binding, current, Notifications } from '../utils';
import { Result } from '../utils/result';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';

export interface IHomeViewProps {
    currentTrackId: string;
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class HomeView extends React.Component<IHomeViewProps> {
    didRefresh: HomeView['refresh'] = this.refresh.bind(this);
    vm = current(HomeViewModel);

    @Binding((a: HomeView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: HomeView['vm']['errors'];

    @Binding((a: HomeView) => a.vm, 'tracks')
    tracks!: HomeView['vm']['tracks'];

    @Binding((a: HomeView) => a.vm, 'likedTracks')
    likedTracks!: HomeView['vm']['likedTracks'];

    @Binding((a: HomeView) => a.vm, 'isLoading')
    isLoading!: HomeView['vm']['isLoading'];

    @Binding((a: HomeView) => a.vm, 'selectedTrack')
    selectedTrack!: HomeView['vm']['selectedTrack'];

    @Binding((a: HomeView) => a.vm, 'trackLyrics')
    trackLyrics!: HomeView['vm']['trackLyrics'];

    @Binding((a: HomeView) => a.vm, 'bannedTrackIds')
    bannedTrackIds!: HomeView['vm']['bannedTrackIds'];

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

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    isBanned(track: TrackViewModelItem) {
        const res = this.bannedTrackIds.find(trackId => trackId === track.id());

        return !!res;
    }

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { HomeView };

