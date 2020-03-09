import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import * as _ from 'underscore';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/newReleases';
import { current } from '../utils';
import { AlbumViewModelItem, NewReleasesViewModel, TrackViewModelItem } from '../viewModels';


export interface INewReleasesViewProps {
    currentTrackId: string;
}

class NewReleasesView extends BaseView<INewReleasesViewProps, NewReleasesView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
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
        'selectAlbumCommand': 'selectAlbumCommand',
        'likeAlbumCommand': 'likeAlbumCommand',
        'unlikeAlbumCommand': 'unlikeAlbumCommand',
        'prop(releases)': 'newReleases',
        'prop(currentAlbum)': 'currentAlbum',
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

