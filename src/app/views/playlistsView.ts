import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { merge, of, Subject, Subscription } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/playlists';
import { Binding, current } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';
import * as _ from 'underscore';


export interface IPlaylistsViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PlaylistsView extends BaseView<IPlaylistsViewProps, PlaylistsView['state']> {
    vm = current(PlaylistsViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    playlists$ = this.vm.playlists$;
    @Binding playlists = this.playlists$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();

    isLoading$ = this.vm.isLoading$;
    @Binding isLoading = this.isLoading$.getValue();

    likedTracks$ = this.vm.likedTracks$;
    @Binding likedTracks = this.likedTracks$.getValue();

    currentPlaylistId$ = this.vm.currentPlaylistId$;
    @Binding currentPlaylistId = this.currentPlaylistId$.getValue();

    newPlaylistName$ = this.vm.newPlaylistName$;
    @Binding newPlaylistName = this.newPlaylistName$.getValue();

    state = {
    };

    selectPlaylistCommand$ = this.vm.selectPlaylistCommand$;
    @Binding selectPlaylistCommand = this.selectPlaylistCommand$.getValue();
    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding loadMoreCommand = this.loadMoreCommand$.getValue();
    loadMoreTracksCommand$ = this.vm.loadMoreTracksCommand$;
    @Binding loadMoreTracksCommand = this.loadMoreTracksCommand$.getValue();
    createPlaylistCommand$ = this.vm.createPlaylistCommand$;
    @Binding createPlaylistCommand = this.vm.createPlaylistCommand$.getValue();

    dispose$ = new Subject<void>();
    disposeSubscription: Subscription;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.playlists$.pipe(map(playlists => ({ playlists }))),
            this.tracks$.pipe(map(tracks => ({ tracks }))),
            this.isLoading$.pipe(map(isLoading => ({ isLoading }))),
            this.likedTracks$.pipe(map(likedTracks => ({ likedTracks }))),
            this.currentPlaylistId$.pipe(map(currentPlaylistId => ({ currentPlaylistId }))),
            this.newPlaylistName$.pipe(map(newPlaylistName => ({ newPlaylistName }))),
            this.selectPlaylistCommand$.pipe(map(selectPlaylistCommand => ({ selectPlaylistCommand }))),
            this.loadMoreCommand$.pipe(map(loadMoreCommand => ({ loadMoreCommand }))),
            this.loadMoreTracksCommand$.pipe(map(loadMoreTracksCommand => ({ loadMoreTracksCommand }))),
            this.createPlaylistCommand$.pipe(map(createPlaylistCommand => ({ createPlaylistCommand }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
            //console.log(v);
            this.setState({
                ...this.state
            });
        });
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PlaylistsView };

