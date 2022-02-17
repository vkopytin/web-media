import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/selectPlaylists';
import { Binding, current, Notify } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface ISelectPlaylistsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    className?: string;
    track: TrackViewModelItem;
    active?: boolean;
}

class SelectPlaylistsView extends React.Component<ISelectPlaylistsViewProps> {
    didRefresh: SelectPlaylistsView['refresh'] = () => { };
    playlistsViewModel = current(PlaylistsViewModel);
    vm = this.props.track;
    
    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: SelectPlaylistsView['vm']['errors'];

    // playlists
    trackPlaylists$ = this.vm.trackPlaylists$;
    @Binding({ didSet: (view) => view.didRefresh() })
    trackPlaylists: SelectPlaylistsView['vm']['trackPlaylists'];

    //items
    playlists$ = this.playlistsViewModel.playlists$;
    @Binding({ didSet: (view) => view.didRefresh() })
    playlists: SelectPlaylistsView['playlistsViewModel']['playlists'];

    isLoading$ = this.playlistsViewModel.isLoading$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isLoading: SelectPlaylistsView['playlistsViewModel']['isLoading'];

    fetchData = () => this.playlistsViewModel.fetchData();

    addToPlaylistCommand$ = this.vm.addToPlaylistCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    addToPlaylistCommand: SelectPlaylistsView['vm']['removeFromPlaylistCommand'];

    removeFromPlaylistCommand$ = this.vm.removeFromPlaylistCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    removeFromPlaylistCommand: SelectPlaylistsView['vm']['removeFromPlaylistCommand'];

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
    }

    componentDidUpdate(prevProps: ISelectPlaylistsViewProps, prevState, snapshot) {
        if (this.props.track !== prevProps.track) {
            this.componentWillUnmount();
            this.componentDidMount();
        }
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { SelectPlaylistsView };

