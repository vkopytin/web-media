import * as _ from 'underscore';
import { BaseView } from '../base/baseView';
import { template } from '../templates/selectPlaylists';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    DeviceViewModelItem,
    PlaylistsViewModel,
    PlaylistsViewModelItem,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface ISelectPlaylistsViewProps {
    track: TrackViewModelItem;
}

class SelectPlaylistsView extends BaseView<ISelectPlaylistsViewProps, {}> {
    playlistsViewModel = current(PlaylistsViewModel);

    state = {
        items: [] as PlaylistsViewModelItem[],
        playlists: [] as PlaylistsViewModelItem[],
        track: this.props.track
    };

    switchDeviceCommand = {
        exec(device: DeviceViewModelItem) { }
    };
    addToPlaylistCommand = {
        exec(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) { }
    };
    removeFromPlaylistCommand = {
        exec(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) { }
    };

    fetchData = () => { };

    binding = bindTo(this, () => this.state.track, {
        'prop(items)': '.playlistsViewModel.playlists',
        'fetchData': '.playlistsViewModel.getchData',
        'prop(playlists)': 'playlists',
        'addToPlaylistCommand': 'addToPlaylistCommand',
        'removeFromPlaylistCommand': 'removeFromPlaylistCommand'
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

    componentDidUpdate(prevProps: ISelectPlaylistsViewProps, prevState, snapshot) {
        this.prop('track', this.props.track);
    }

    prop<K extends keyof SelectPlaylistsView['state']>(propName: K, val?: SelectPlaylistsView['state'][K]): SelectPlaylistsView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            super.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    addToPlaylist(playlist: PlaylistsViewModelItem) {

    }

    playlistHasTrack(playlist: PlaylistsViewModelItem, track: TrackViewModelItem) {
        return !!_.find(this.prop('playlists'), p => p.id() === playlist.id());
    }

    render() {
        return template(this);
    }
}

export { SelectPlaylistsView };