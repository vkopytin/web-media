import React from 'react';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/playlists';
import { Binding, current, Notify } from '../utils';
import { PlaylistsViewModel } from '../viewModels';


export interface IPlaylistsViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PlaylistsView extends React.Component<IPlaylistsViewProps> {
    didRefresh: PlaylistsView['refresh'] = () => { };
    vm = current(PlaylistsViewModel);
    
    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: PlaylistsView['vm']['errors'];

    playlists$ = this.vm.playlists$;
    @Binding({ didSet: (view) => view.didRefresh() })
    playlists: PlaylistsView['vm']['playlists'];

    tracks$ = this.vm.tracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    tracks: PlaylistsView['vm']['tracks'];

    isLoading$ = this.vm.isLoading$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isLoading: PlaylistsView['vm']['isLoading'];

    likedTracks$ = this.vm.likedTracks$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likedTracks: PlaylistsView['vm']['likedTracks'];

    currentPlaylistId$ = this.vm.currentPlaylistId$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentPlaylistId: PlaylistsView['vm']['currentPlaylistId'];

    newPlaylistName$ = this.vm.newPlaylistName$;
    @Binding({ didSet: (view) => view.didRefresh() })
    newPlaylistName: PlaylistsView['vm']['newPlaylistName'];

    selectPlaylistCommand$ = this.vm.selectPlaylistCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    selectPlaylistCommand: PlaylistsView['vm']['selectPlaylistCommand'];

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    loadMoreCommand: PlaylistsView['vm']['loadMoreCommand'];

    loadMoreTracksCommand$ = this.vm.loadMoreTracksCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    loadMoreTracksCommand: PlaylistsView['vm']['loadMoreTracksCommand'];

    createPlaylistCommand$ = this.vm.createPlaylistCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    createPlaylistCommand: PlaylistsView['vm']['createPlaylistCommand'];

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
    }

    refresh(args) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PlaylistsView };

