import * as React from 'react';
import { template } from '../templates/profile';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import { ProfileViewModel } from '../viewModels/profileViewModel';
import { PlaylistViewModelItem } from '../viewModels/playlistViewModelItem';
import { current } from '../utils';
import { TrackViewModelItem } from '../viewModels/trackViewModelItem';


export interface IProfileViewProps {

}

class ProfileView extends withEvents(React.Component)<IProfileViewProps, {}> {
    state = {
        openLogin: false,
        playlists: [] as PlaylistViewModelItem[],
        tracks: [] as TrackViewModelItem[],
        currentPlaylist: null as PlaylistViewModelItem
    };
    selectPlaylistCommand = { exec(playlist) { } };
    binding = bindTo(this, () => current(ProfileViewModel), {
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

    prop<K extends keyof ProfileView['state']>(propName: K, val?: ProfileView['state'][K]): ProfileView['state'][K] {
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

export { ProfileView };
