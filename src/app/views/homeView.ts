import React from 'react';
import { template } from '../templates/home';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';

export interface IHomeViewProps {
    currentTrackId: string;
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class HomeView extends React.Component<IHomeViewProps> {
    didRefresh: HomeView['refresh'] = this.refresh.bind(this);
    vm = inject(HomeViewModel);

    @Binding((a: HomeView) => a.vm, 'errors')
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
    refreshCommand!: ICommand<string>;

    @Binding((a: HomeView) => a.vm, 'selectTrackCommand')
    selectTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: HomeView) => a.vm, 'likeTrackCommand')
    likeTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: HomeView) => a.vm, 'unlikeTrackCommand')
    unlikeTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: HomeView) => a.vm, 'findTrackLyricsCommand')
    findTrackLyricsCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: HomeView) => a.vm, 'bannTrackCommand')
    bannTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: HomeView) => a.vm, 'removeBannFromTrackCommand')
    removeBannFromTrackCommand!: ICommand<TrackViewModelItem>;

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

