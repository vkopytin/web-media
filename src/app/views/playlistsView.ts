import React from 'react';
import { template } from '../templates/playlists';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface IPlaylistsViewProps {
    currentTrackId: string;
    loadMore?: boolean;
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class PlaylistsView extends React.Component<IPlaylistsViewProps> {
    didRefresh: PlaylistsView['refresh'] = this.refresh.bind(this);
    vm = inject(PlaylistsViewModel);

    @Binding((a: PlaylistsView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
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
    selectPlaylistCommand!: PlaylistsView['vm']['selectPlaylistCommand'];

    @Binding((a: PlaylistsView) => a.vm, 'loadMoreCommand')
    loadMoreCommand!: PlaylistsView['vm']['loadMoreCommand'];

    @Binding((a: PlaylistsView) => a.vm, 'loadMoreTracksCommand')
    loadMoreTracksCommand!: PlaylistsView['vm']['loadMoreTracksCommand'];

    @Binding((a: PlaylistsView) => a.vm, 'createPlaylistCommand')
    createPlaylistCommand!: PlaylistsView['vm']['createPlaylistCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: IPlaylistsViewProps) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PlaylistsView };

