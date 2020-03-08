import { BaseView } from '../base/baseView';
import * as _ from 'underscore';
import { template } from '../templates/newReleases';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    NewReleasesViewModel,
    AlbumViewModelItem,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface INewReleasesViewProps {
    currentTrackId: string;
}

class NewReleasesView extends BaseView<INewReleasesViewProps, NewReleasesView['state']> {
    state = {
        openLogin: false,
        releases: [] as AlbumViewModelItem[],
        currentAlbum: null as AlbumViewModelItem,
        likedAlbums: [] as AlbumViewModelItem[],
        tracks: [] as TrackViewModelItem[]
    };
    
    selectAlbumCommand = {
        exec(album: AlbumViewModelItem) { }
    };

    likeAlbumCommand = {
        exec(album: AlbumViewModelItem) { }
    };

    unlikeAlbumCommand = {
        exec(album: AlbumViewModelItem) { }
    };

    binding = bindTo(this, () => current(NewReleasesViewModel), {
        'prop(releases)': 'newReleases',
        'prop(currentAlbum)': 'currentAlbum',
        'selectAlbumCommand': 'selectAlbumCommand',
        'unlikeAlbumCommand': 'unlikeAlbumCommand',
        'likeAlbumCommand': 'likeAlbumCommand',
        'prop(tracks)': 'tracks',
        'prop(likedAlbums)': 'likedAlbums'
    });

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

    isLiked(album: AlbumViewModelItem) {
        return !!_.find(this.prop('likedAlbums'), item => item.id() === album.id());
    }

    render() {
        return template(this);
    }
}

export { NewReleasesView };
