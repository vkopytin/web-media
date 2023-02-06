import React from 'react';
import * as _ from 'underscore';
import { template } from '../templates/selectPlaylists';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface ISelectPlaylistsViewProps {
    className?: string;
    track: TrackViewModelItem;
    active?: boolean;
}

class SelectPlaylistsView extends React.Component<ISelectPlaylistsViewProps> {
    didRefresh: SelectPlaylistsView['refresh'] = this.refresh.bind(this);
    playlistsViewModel = inject(PlaylistsViewModel);
    vm = this.props.track;

    @Binding((a: SelectPlaylistsView) => a.vm, 'errors')
    errors!: Result[];

    @Binding((a: SelectPlaylistsView) => a.playlistsViewModel, 'isLoading')
    isLoading!: boolean;

    // playlists
    @Binding((a: SelectPlaylistsView) => a.vm, 'trackPlaylists')
    trackPlaylists!: PlaylistsViewModelItem[];

    //items
    @Binding((a: SelectPlaylistsView) => a.playlistsViewModel, 'playlists')
    playlists!: PlaylistsViewModelItem[];

    @Binding((a: SelectPlaylistsView) => a.vm, 'addToPlaylistCommand')
    addToPlaylistCommand!: ICommand<TrackViewModelItem, PlaylistsViewModelItem>;

    @Binding((a: SelectPlaylistsView) => a.vm, 'removeFromPlaylistCommand')
    removeFromPlaylistCommand!: ICommand<TrackViewModelItem, PlaylistsViewModelItem>;

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: ISelectPlaylistsViewProps) {
        if (this.props.track !== prevProps.track) {
            this.componentWillUnmount();
            this.componentDidMount();
        }
    }

    async fetchData(): Promise<void> {
        await this.playlistsViewModel.fetchData();
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    isPlaylistInTracksPlaylist(playlist: PlaylistsViewModelItem): boolean {
        const res = _.find(this.trackPlaylists, (p: PlaylistsViewModelItem) => p.id() === playlist.id());
        return !!res;
    }

    render() {
        return template(this);
    }
}

export { SelectPlaylistsView };

