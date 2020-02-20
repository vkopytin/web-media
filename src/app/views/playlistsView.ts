import * as React from 'react';
import { template } from '../templates/playlists';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    PlaylistsViewModel,
    PlaylistsViewModelItem,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface IPlaylistsViewProps {

}

class PlaylistsView extends withEvents(React.Component)<IPlaylistsViewProps, {}> {
    state = {
        openLogin: false,
        playlists: [] as PlaylistsViewModelItem[],
        tracks: [] as TrackViewModelItem[],
        currentPlaylist: null as PlaylistsViewModelItem
    };
    selectPlaylistCommand = { exec(playlist) { } };
    binding = bindTo(this, () => current(PlaylistsViewModel), {
        'prop(playlists)': 'playlists',
        'prop(tracks)': 'tracks',
        'selectPlaylistCommand': 'selectPlaylistCommand',
        'prop(currentPlaylist)': 'currentPlaylist'
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

    prop<K extends keyof PlaylistsView['state']>(propName: K, val?: PlaylistsView['state'][K]): PlaylistsView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    render() {
        return template(this);
    }
}

export { PlaylistsView };
