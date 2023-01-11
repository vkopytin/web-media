import React from 'react';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/selectPlaylists';
import { Binding, current, Notifications } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface ISelectPlaylistsViewProps {
    showErrors<T>(errors: ServiceResult<T, Error>[]): void;
    className?: string;
    track: TrackViewModelItem;
    active?: boolean;
}

class SelectPlaylistsView extends React.Component<ISelectPlaylistsViewProps> {
    didRefresh: SelectPlaylistsView['refresh'] = this.refresh.bind(this);
    playlistsViewModel = current(PlaylistsViewModel);
    vm = this.props.track;

    errors$ = this.vm.errors$;
    @Binding<SelectPlaylistsView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors: SelectPlaylistsView['vm']['errors'];

    // playlists
    trackPlaylists$ = this.vm.trackPlaylists$;
    @Binding()
    trackPlaylists: SelectPlaylistsView['vm']['trackPlaylists'];

    //items
    playlists$ = this.playlistsViewModel.playlists$;
    @Binding()
    playlists: SelectPlaylistsView['playlistsViewModel']['playlists'];

    isLoading$ = this.playlistsViewModel.isLoading$;
    @Binding()
    isLoading: SelectPlaylistsView['playlistsViewModel']['isLoading'];

    fetchData = () => this.playlistsViewModel.fetchData();

    addToPlaylistCommand$ = this.vm.addToPlaylistCommand$;
    @Binding()
    addToPlaylistCommand: SelectPlaylistsView['vm']['removeFromPlaylistCommand'];

    removeFromPlaylistCommand$ = this.vm.removeFromPlaylistCommand$;
    @Binding()
    removeFromPlaylistCommand: SelectPlaylistsView['vm']['removeFromPlaylistCommand'];

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

    refresh(args: { inst: unknown; value: ServiceResult<unknown, Error>[] }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
        this.setState({
            ...this.state,
        });
    }

    playlistHasTrack(playlist: PlaylistsViewModelItem, track: TrackViewModelItem) {
        const res = _.find(this.trackPlaylists, (p: PlaylistsViewModelItem) => p.id() === playlist.id());
        return !!res;
    }

    showErrors(errors: ServiceResult<unknown, Error>[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { SelectPlaylistsView };

