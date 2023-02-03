import React from 'react';
import { ISearchType } from '../ports/iMediaProt';
import { template } from '../templates/search';
import { asyncDebounce, Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { ICommand } from '../utils/scheduler';
import { AlbumViewModelItem, PlaylistsViewModelItem, SearchViewModel, TrackViewModelItem } from '../viewModels';
import { ArtistViewModelItem } from '../viewModels/artistViewModelItem';


export interface ISearchViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends React.Component<ISearchViewProps> {
    didRefresh: SearchView['refresh'] = this.refresh.bind(this);
    vm = inject(SearchViewModel);

    @Binding((a: SearchView) => a.vm, 'errors')
    errors!: Result[];

    @Binding((a: SearchView) => a.vm, 'term')
    term!: string;

    @Binding((a: SearchView) => a.vm, 'tracks')
    tracks!: TrackViewModelItem[];

    @Binding((a: SearchView) => a.vm, 'artists')
    artists!: ArtistViewModelItem[];

    @Binding((a: SearchView) => a.vm, 'albums')
    albums!: AlbumViewModelItem[];

    @Binding((a: SearchView) => a.vm, 'playlists')
    playlists!: PlaylistsViewModelItem[];

    @Binding((a: SearchView) => a.vm, 'searchType')
    searchType!: ISearchType;

    @Binding((a: SearchView) => a.vm, 'currentAlbum')
    currentAlbum!: AlbumViewModelItem | null;

    @Binding((a: SearchView) => a.vm, 'currentPlaylist')
    currentPlaylist!: PlaylistsViewModelItem | null;

    @Binding((a: SearchView) => a.vm, 'currentArtist')
    currentArtist!: ArtistViewModelItem | null;

    @Binding((a: SearchView) => a.vm, 'currentTracks')
    currentTracks!: TrackViewModelItem[];

    @Binding((a: SearchView) => a.vm, 'selectedItem')
    selectedItem!: TrackViewModelItem | null;

    @Binding((a: SearchView) => a.vm, 'searchCommand')
    searchCommand!: ICommand<string>;

    @Binding((a: SearchView) => a.vm, 'chageSearchTypeCommand')
    changeSearchTypeCommand!: ICommand<ISearchType>;

    @Binding((a: SearchView) => a.vm, 'selectAlbumCommand')
    selectAlbumCommand!: ICommand<AlbumViewModelItem | null>;

    @Binding((a: SearchView) => a.vm, 'selectPlaylistCommand')
    selectPlaylistCommand!: ICommand<PlaylistsViewModelItem | null>;

    @Binding((a: SearchView) => a.vm, 'selectArtistCommand')
    selectArtistCommand!: ICommand<ArtistViewModelItem | null>;

    @Binding((a: SearchView) => a.vm, 'loadMoreCommand')
    loadMoreCommand!: ICommand;

    @Binding((a: SearchView) => a.vm, 'likeTrackCommand')
    likeTrackCommand!: ICommand<TrackViewModelItem>;

    @Binding((a: SearchView) => a.vm, 'unlikeTrackCommand')
    unlikeTrackCommand!: ICommand<TrackViewModelItem>;

    searchTracks = asyncDebounce((term: string) => {
        this.searchCommand.exec(term);
    }, 300);

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate() {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    refresh(): void {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem): boolean {
        return track.id() === this.props.currentTrackId;
    }

    showErrors(errors: Result[]): void {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { SearchView };

