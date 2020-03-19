import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import * as _ from 'underscore';
import { ISearchType } from '../adapter/spotify';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/search';
import { current } from '../utils';
import { AlbumViewModelItem, PlaylistsViewModelItem, SearchViewModel, TrackViewModelItem } from '../viewModels';
import { ArtistViewModelItem } from '../viewModels/artistViewModelItem';


export interface ISearchViewProps {
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends BaseView<ISearchViewProps, SearchView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        term: '',
        searchType: 'track' as ISearchType,
        tracks: [] as TrackViewModelItem[],
        artists: [] as ArtistViewModelItem[],
        albums: [] as AlbumViewModelItem[],
        playlists: [] as PlaylistsViewModelItem[],
        currentAlbum: null as AlbumViewModelItem,
        currentPlaylist: null as PlaylistsViewModelItem,
        currentArtist: null as ArtistViewModelItem,
        currentTracks: [] as TrackViewModelItem[],
        selectedItem: null as TrackViewModelItem
    };

    loadMoreCommand = { exec() { } };
    likeTrackCommand = { exec(track: TrackViewModelItem) { } };
    unlikeTrackCommand = { exec(track: TrackViewModelItem) { } };
    
    binding = bindTo(this, () => current(SearchViewModel), {
        'loadMoreCommand': 'loadMoreCommand',
        'prop(term)': 'term',
        'prop(tracks)': 'tracks',
        'prop(artists)': 'artists',
        'prop(albums)': 'albums',
        'prop(playlists)': 'playlists',
        'prop(searchType)': 'searchType',
        'prop(currentArtist)': 'currentArtist',
        'prop(currentAlbum)': 'currentAlbum',
        'prop(currentPlaylist)': 'currentPlaylist',
        'prop(currentTracks)': 'currentTracks',
        'prop(selectedItem)': 'selectedItem'
    });

    searchTracks = _.debounce(term => {
        this.prop('term', term);
    }, 500);

    constructor(props) {
        super(props);
        subscribeToChange(this.binding, () => {
            this.setState({
                ...this.state
            });
        });
    }

    componentDidMount() {
        updateLayout(this.binding);
    }

    componentWillUnmount() {
        unbindFrom(this.binding);
    }

    componentDidUpdate(prevProps: ISearchViewProps, prevState, snapshot) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    render() {
        return template(this);
    }
}

export { SearchView };

