import React from 'react';
import * as _ from 'underscore';
import { template } from '../templates/selectPlaylists';
import { Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface ISelectPlaylistsViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    className?: string;
    track: TrackViewModelItem;
    active?: boolean;
}

class SelectPlaylistsView extends React.Component<ISelectPlaylistsViewProps> {
    didRefresh: SelectPlaylistsView['refresh'] = this.refresh.bind(this);
    playlistsViewModel = inject(PlaylistsViewModel);
    vm = this.props.track;

    @Binding((a: SelectPlaylistsView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
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
    addToPlaylistCommand!: SelectPlaylistsView['vm']['addToPlaylistCommand'];

    @Binding((a: SelectPlaylistsView) => a.vm, 'removeFromPlaylistCommand')
    removeFromPlaylistCommand!: SelectPlaylistsView['vm']['removeFromPlaylistCommand'];

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

    fetchData() {
        return this.playlistsViewModel.fetchData();
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    playlistHasTrack(playlist: PlaylistsViewModelItem, track: TrackViewModelItem) {
        const res = _.find(this.trackPlaylists, (p: PlaylistsViewModelItem) => p.id() === playlist.id());
        return !!res;
    }

    showErrors(errors: Result[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { SelectPlaylistsView };

