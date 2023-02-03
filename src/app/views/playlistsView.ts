import React from 'react';
import { template } from '../templates/playlists';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface IPlaylistsViewProps {
    currentTrackId: string;
    loadMore?: boolean;
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class PlaylistsView extends React.Component<IPlaylistsViewProps> {
    didRefresh: PlaylistsView['refresh'] = this.refresh.bind(this);
    vm = inject(PlaylistsViewModel);

    @Binding((a: PlaylistsView) => a.vm, 'errors')
    errors!: Result[];

    @Binding((a: PlaylistsView) => a.vm, 'newPlaylistName')
    newPlaylistName!: string;

    @Binding((a: PlaylistsView) => a.vm, 'playlists')
    playlists!: PlaylistsViewModelItem[];

    @Binding((a: PlaylistsView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: PlaylistsView) => a.vm, 'isLoading')
    isLoading!: boolean;

    @Binding((a: PlaylistsView) => a.vm, 'likedTracks')
    likedTracks!: TrackViewModelItem[];

    @Binding((a: PlaylistsView) => a.vm, 'currentPlaylistId')
    currentPlaylistId!: PlaylistsView['vm']['currentPlaylistId'];

    @Binding((a: PlaylistsView) => a.vm, 'selectPlaylistCommand')
    selectPlaylistCommand!: ICommand<string | null>;

    @Binding((a: PlaylistsView) => a.vm, 'loadMoreCommand')
    loadMoreCommand!: ICommand;

    @Binding((a: PlaylistsView) => a.vm, 'loadMoreTracksCommand')
    loadMoreTracksCommand!: ICommand;

    @Binding((a: PlaylistsView) => a.vm, 'createPlaylistCommand')
    createPlaylistCommand!: ICommand<boolean>;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate() {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    showErrors(errors: Result<Error>[]): void {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PlaylistsView };

