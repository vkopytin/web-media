import * as React from 'react';
import * as _ from 'underscore';
import { template } from '../templates/newReleases';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    NewReleasesViewModel,
    AlbumViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface INewReleasesViewProps {
    currentTrackId: string;
}

class NewReleasesView extends withEvents(React.Component)<INewReleasesViewProps, {}> {
    state = {
        openLogin: false,
        releases: [] as AlbumViewModelItem[],
        currentAlbum: null as AlbumViewModelItem,
        likedAlbums: [] as AlbumViewModelItem[]
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

    prop<K extends keyof NewReleasesView['state']>(propName: K, val?: NewReleasesView['state'][K]): NewReleasesView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    isLiked(album: AlbumViewModelItem) {
        return !!_.find(this.prop('likedAlbums'), item => item.id() === album.id());
    }

    render() {
        return template(this);
    }
}

export { NewReleasesView };
