import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/playlists';
import { Binding, current, Notifications } from '../utils';
import { PlaylistsViewModel } from '../viewModels';


export interface IPlaylistsViewProps {
    currentTrackId: string;
    showErrors<T>(errors: ServiceResult<T, Error>[]): void;
}

class PlaylistsView extends React.Component<IPlaylistsViewProps> {
    didRefresh: PlaylistsView['refresh'] = this.refresh.bind(this);
    vm = current(PlaylistsViewModel);

    errors$ = this.vm.errors$;
    @Binding<PlaylistsView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: PlaylistsView['vm']['errors'];

    playlists$ = this.vm.playlists$;
    @Binding()
    playlists!: PlaylistsView['vm']['playlists'];

    tracks$ = this.vm.tracks$;
    @Binding()
    tracks!: PlaylistsView['vm']['tracks'];

    isLoading$ = this.vm.isLoading$;
    @Binding()
    isLoading!: PlaylistsView['vm']['isLoading'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding()
    likedTracks!: PlaylistsView['vm']['likedTracks'];

    currentPlaylistId$ = this.vm.currentPlaylistId$;
    @Binding()
    currentPlaylistId!: PlaylistsView['vm']['currentPlaylistId'];

    newPlaylistName$ = this.vm.newPlaylistName$;
    @Binding()
    newPlaylistName!: PlaylistsView['vm']['newPlaylistName'];

    selectPlaylistCommand$ = this.vm.selectPlaylistCommand$;
    @Binding()
    selectPlaylistCommand!: PlaylistsView['vm']['selectPlaylistCommand'];

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding()
    loadMoreCommand!: PlaylistsView['vm']['loadMoreCommand'];

    loadMoreTracksCommand$ = this.vm.loadMoreTracksCommand$;
    @Binding()
    loadMoreTracksCommand!: PlaylistsView['vm']['loadMoreTracksCommand'];

    createPlaylistCommand$ = this.vm.createPlaylistCommand$;
    @Binding()
    createPlaylistCommand!: PlaylistsView['vm']['createPlaylistCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(args: { inst: unknown; value: ServiceResult<unknown, Error>[] }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    showErrors(errors: ServiceResult<unknown, Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PlaylistsView };

