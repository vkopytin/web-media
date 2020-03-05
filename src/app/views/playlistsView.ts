import { BaseView } from '../base/baseView';
import { template } from '../templates/playlists';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    PlaylistsViewModel,
    PlaylistsViewModelItem,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';
import { ServiceResult } from '../base/serviceResult';


export interface IPlaylistsViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PlaylistsView extends BaseView<IPlaylistsViewProps, PlaylistsView['state']> {
    state = {
        openLogin: false,
        playlists: [] as PlaylistsViewModelItem[],
        tracks: [] as TrackViewModelItem[],
        likedTracks: [] as TrackViewModelItem[],
        currentPlaylistId: '',
        isLoading: false,
        newPlaylistName: ''
    };
    selectPlaylistCommand = { exec(playlist) { } };
    loadMoreCommand = { exec() { } };
    loadMoreTracksCommand = { exec() {} };
    createPlaylistCommand = { exec(isPublic: boolean) { } };

    binding = bindTo(this, () => current(PlaylistsViewModel), {
        'prop(playlists)': 'playlists',
        'prop(tracks)': 'tracks',
        'prop(isLoading)': 'isLoading',
        'loadMoreCommand': 'loadMoreCommand',
        'loadMoreTracksCommand': 'loadMoreTracksCommand',
        'prop(likedTracks)': 'likedTracks',
        'selectPlaylistCommand': 'selectPlaylistCommand',
        'createPlaylistCommand': 'createPlaylistCommand',
        'prop(currentPlaylistId)': 'currentPlaylistId',
        'prop(newPlaylistName)': 'newPlaylistName'
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
