import * as React from 'react';
import { template } from '../templates/albums';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    TrackViewModelItem,
    AlbumViewModelItem,
    NewReleasesViewModel
} from '../viewModels';
import { current } from '../utils';


export interface IAlbumsViewProps {
    album: AlbumViewModelItem;
}

class AlbumsView extends withEvents(React.Component)<IAlbumsViewProps, {}> {
    state = {
        openLogin: false,
        tracks: [] as TrackViewModelItem[],
    };
    binding = bindTo(this, () => current(NewReleasesViewModel), {
        'prop(tracks)': 'tracks'
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

    prop<K extends keyof AlbumsView['state']>(propName: K, val?: AlbumsView['state'][K]): AlbumsView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    uri() {
        return this.props.album.uri();
    }

    render() {
        return template(this);
    }
}

export { AlbumsView };
