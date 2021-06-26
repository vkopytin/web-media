import React from 'react';
import { merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/selectPlaylists';
import { Binding, current } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface ISelectPlaylistsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    className?: string;
    track: TrackViewModelItem;
    active?: boolean;
}

class SelectPlaylistsView extends React.Component<ISelectPlaylistsViewProps> {
    playlistsViewModel = current(PlaylistsViewModel);
    vm = this.props.track;
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    // playlists
    trackPlaylists$ = this.vm.trackPlaylists$;
    @Binding trackPlaylists = this.trackPlaylists$.getValue();

    //items
    playlists$ = this.playlistsViewModel.playlists$;
    @Binding playlists = this.playlists$.getValue();

    fetchData = () => this.playlistsViewModel.fetchData();

    addToPlaylistCommand$ = this.vm.addToPlaylistCommand$;
    @Binding addToPlaylistCommand = this.addToPlaylistCommand$.getValue();

    removeFromPlaylistCommand$ = this.vm.removeFromPlaylistCommand$;
    @Binding removeFromPlaylistCommand = this.removeFromPlaylistCommand$.getValue();

    dispose$: Subject<void>;
    disposeSubscription: Subscription;

    componentDidMount() {
        this.dispose$ = new Subject<void>();
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.trackPlaylists$.pipe(map(trackPlaylists => ({ trackPlaylists }))),
            this.playlists$.pipe(map(playlists => ({ playlists }))),
            this.addToPlaylistCommand$.pipe(map(addToPlaylistCommand => ({ addToPlaylistCommand }))),
            this.removeFromPlaylistCommand$.pipe(map(removeFromPlaylistCommand => ({ removeFromPlaylistCommand }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
            //console.log(v);
            this.setState({
                ...this.state
            });
        });
        this.errors$.pipe(
            takeUntil(this.dispose$),
            map(errors => this.showErrors(errors))
        ).subscribe();
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
    }

    componentDidUpdate(prevProps: ISelectPlaylistsViewProps, prevState, snapshot) {
        if (this.props.track !== prevProps.track) {
            this.componentWillUnmount();
            this.componentDidMount();
        }
    }

    addToPlaylist(playlist: PlaylistsViewModelItem) {

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

