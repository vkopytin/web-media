import React from 'react';
import { PlaylistsService } from '../service/playlistsService';
import { template } from '../templates/pickPlaylist';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { HomeViewModel, PlaylistsViewModel, PlaylistsViewModelItem } from '../viewModels';

class PickPlaylistsView extends React.Component {
    didRefresh: PickPlaylistsView['refresh'] = this.refresh.bind(this);
    vm = inject(PlaylistsViewModel);
    homeVm = inject(HomeViewModel);
    playlistsService = inject(PlaylistsService);

    @Binding((a: PickPlaylistsView) => a.vm, 'errors')
    errors!: Result[];

    @Binding((a: PickPlaylistsView) => a.homeVm, 'selectedPlaylist')
    selectedPlaylist!: PlaylistsViewModelItem | null;

    @Binding((a: PickPlaylistsView) => a.playlistsService, 'playlists')
    playlists!: PlaylistsViewModelItem[];

    @Binding((a: PickPlaylistsView) => a.homeVm, 'selectPlaylistCommand')
    selectPlaylistCommand!: ICommand<PlaylistsViewModelItem | null>;

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

    render() {
        return template(this);
    }
}

export { PickPlaylistsView };
