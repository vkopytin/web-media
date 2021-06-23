import React from 'react';
import { BehaviorSubject, merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/search';
import { Binding, current } from '../utils';
import { SearchViewModel, TrackViewModelItem } from '../viewModels';


export interface ISearchViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends React.Component<ISearchViewProps> {
    vm = current(SearchViewModel);
    
    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    term$ = this.vm.term$;
    @Binding term = this.term$.getValue();

    tracks$ = this.vm.tracks$;
    @Binding tracks = this.tracks$.getValue();

    artists$ = this.vm.artists$;
    @Binding artists = this.artists$.getValue();

    albums$ = this.vm.albums$;
    @Binding albums = this.albums$.getValue();

    playlists$ = this.vm.playlists$;
    @Binding playlists = this.playlists$.getValue();

    searchType$ = this.vm.searchType$;
    @Binding searchType = this.searchType$.getValue();

    currentAlbum$ = this.vm.currentAlbum$;
    @Binding currentAlbum = this.currentAlbum$.getValue();

    currentPlaylist$ = this.vm.currentPlaylist$;
    @Binding currentPlaylist = this.currentPlaylist$.getValue();

    currentArtist$ = this.vm.currentArtist$;
    @Binding currentArtist = this.currentArtist$.getValue();

    currentTracks$ = this.vm.currentTracks$;
    @Binding currentTracks = this.currentTracks$.getValue();

    selectedItem$ = this.vm.selectedItem$;
    @Binding selectedItem = this.selectedItem$.getValue();

    loadMoreCommand$ = this.vm.loadMoreCommand$;
    @Binding loadMoreCommand = this.loadMoreCommand$.getValue();

    likeTrackCommand$ = new BehaviorSubject({ exec(track: TrackViewModelItem) { } });
    @Binding likeTrackCommand = this.likeTrackCommand$.getValue();
    unlikeTrackCommand$ = new BehaviorSubject({ exec(track: TrackViewModelItem) { } });
    @Binding unlikeTrackCommand = this.unlikeTrackCommand$.getValue();
    
    dispose$ = new Subject<void>();
    disposeSubscription: Subscription;

    searchTracks = _.debounce(term => {
        this.term = term;
    }, 300);

    componentDidMount() {
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.term$.pipe(map(term => ({ term }))),
            this.tracks$.pipe(map(tracks => ({ tracks }))),
            this.artists$.pipe(map(artists => ({ artists }))),
            this.albums$.pipe(map(albums => ({ albums }))),
            this.playlists$.pipe(map(playlists => ({ playlists }))),
            this.searchType$.pipe(map(searchType => ({ searchType }))),
            this.currentAlbum$.pipe(map(currentAlbum => ({ currentAlbum }))),
            this.currentArtist$.pipe(map(currentArtist => ({ currentArtist }))),
            this.currentPlaylist$.pipe(map(currentPlaylist => ({ currentPlaylist }))),
            this.currentTracks$.pipe(map(currentTracks => ({ currentTracks }))),
            this.selectedItem$.pipe(map(selectedItem => ({ selectedItem }))),
            this.loadMoreCommand$.pipe(map(loadMoreCommand => ({ loadMoreCommand }))),
            this.likeTrackCommand$.pipe(map(likeTrackCommand => ({ likeTrackCommand }))),
            this.unlikeTrackCommand$.pipe(map(unlikeTrackCommand => ({ unlikeTrackCommand }))),
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

    componentDidUpdate(prevProps: ISearchViewProps, prevState, snapshot) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { SearchView };

