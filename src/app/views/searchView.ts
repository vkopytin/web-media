import React from 'react';
import { template } from '../templates/search';
import { asyncDebounce, Binding, Notifications } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { SearchViewModel, TrackViewModelItem } from '../viewModels';


export interface ISearchViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends React.Component<ISearchViewProps> {
    didRefresh: SearchView['refresh'] = this.refresh.bind(this);
    vm = inject(SearchViewModel);

    @Binding((a: SearchView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: SearchView['vm']['errors'];

    @Binding((a: SearchView) => a.vm, 'term')
    term!: SearchView['vm']['term'];

    @Binding((a: SearchView) => a.vm, 'tracks')
    tracks!: SearchView['vm']['tracks'];

    @Binding((a: SearchView) => a.vm, 'artists')
    artists!: SearchView['vm']['artists'];

    @Binding((a: SearchView) => a.vm, 'albums')
    albums!: SearchView['vm']['albums'];

    @Binding((a: SearchView) => a.vm, 'playlists')
    playlists!: SearchView['vm']['playlists'];

    @Binding((a: SearchView) => a.vm, 'searchType')
    searchType!: SearchView['vm']['searchType'];

    @Binding((a: SearchView) => a.vm, 'currentAlbum')
    currentAlbum!: SearchView['vm']['currentAlbum'];

    @Binding((a: SearchView) => a.vm, 'currentPlaylist')
    currentPlaylist!: SearchView['vm']['currentPlaylist'];

    @Binding((a: SearchView) => a.vm, 'currentArtist')
    currentArtist!: SearchView['vm']['currentArtist'];

    @Binding((a: SearchView) => a.vm, 'currentTracks')
    currentTracks!: SearchView['vm']['currentTracks'];

    @Binding((a: SearchView) => a.vm, 'selectedItem')
    selectedItem!: SearchView['vm']['selectedItem'];

    @Binding((a: SearchView) => a.vm, 'searchCommand')
    searchCommand!: SearchView['vm']['searchCommand'];

    @Binding((a: SearchView) => a.vm, 'chageSearchTypeCommand')
    changeSearchTypeCommand!: SearchView['vm']['chageSearchTypeCommand'];

    @Binding((a: SearchView) => a.vm, 'selectArtistCommand')
    selectAlbumCommand!: SearchView['vm']['selectArtistCommand'];

    @Binding((a: SearchView) => a.vm, 'selectPlaylistCommand')
    selectPlaylistCommand!: SearchView['vm']['selectPlaylistCommand'];

    @Binding((a: SearchView) => a.vm, 'selectArtistCommand')
    selectArtistCommand!: SearchView['vm']['selectArtistCommand'];

    @Binding((a: SearchView) => a.vm, 'loadMoreCommand')
    loadMoreCommand!: SearchView['vm']['loadMoreCommand'];

    @Binding((a: SearchView) => a.vm, 'likeTrackCommand')
    likeTrackCommand!: SearchView['vm']['likeTrackCommand'];

    @Binding((a: SearchView) => a.vm, 'unlikeTrackCommand')
    unlikeTrackCommand!: SearchView['vm']['unlikeTrackCommand'];

    searchTracks = asyncDebounce((term: string) => {
        this.searchCommand.exec(term);
    }, 300);

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    componentDidUpdate(prevProps: ISearchViewProps) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    refresh() {
        this.setState({
            ...this.state,
        });
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    showErrors(errors: Result[]) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { SearchView };

