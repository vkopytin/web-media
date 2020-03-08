import { BaseView } from '../base/baseView';
import { template } from '../templates/search';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    SearchViewModel,
    TrackViewModelItem,
    AlbumViewModelItem,
    PlaylistsViewModelItem
} from '../viewModels';
import { current } from '../utils';
import * as _ from 'underscore';
import { ISearchType } from '../adapter/spotify';
import { ArtistViewModelItem } from '../viewModels/artistViewModelItem';


export interface ISearchViewProps {
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends BaseView<ISearchViewProps, SearchView['state']> {
    state = {
        term: '',
        searchType: 'track' as ISearchType,
        tracks: [] as TrackViewModelItem[],
        artists: [] as ArtistViewModelItem[],
        albums: [] as AlbumViewModelItem[],
        playlists: [] as PlaylistsViewModelItem[],
        currentAlbum: null as AlbumViewModelItem,
        currentPlaylist: null as PlaylistsViewModelItem,
        currentTracks: [] as TrackViewModelItem[]
    };

    loadMoreCommand = { exec() { } };
    
    binding = bindTo(this, () => current(SearchViewModel), {
        'prop(term)': 'term',
        'prop(tracks)': 'tracks',
        'prop(artists)': 'artists',
        'prop(albums)': 'albums',
        'prop(playlists)': 'playlists',
        'prop(searchType)': 'searchType',
        'loadMoreCommand': 'loadMoreCommand',
        'prop(currentAlbum)': 'currentAlbum',
        'prop(currentPlaylist)': 'currentPlaylist',
        'prop(currentTracks)': 'currentTracks'
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
