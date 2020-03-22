import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import * as _ from 'underscore';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/selectPlaylists';
import { current } from '../utils';
import { DeviceViewModelItem, PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface ISelectPlaylistsViewProps {
    className?: string;
    track: TrackViewModelItem;
    active?: boolean;
}

class SelectPlaylistsView extends BaseView<ISelectPlaylistsViewProps, SelectPlaylistsView['state']> {
    playlistsViewModel = current(PlaylistsViewModel);

    state = {
        errors: [] as ServiceResult<any, Error>[],
        items: [] as PlaylistsViewModelItem[],
        playlists: [] as PlaylistsViewModelItem[],
        track: (this as any).props.track as TrackViewModelItem
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
        'addToPlaylistCommand': 'addToPlaylistCommand',
        'removeFromPlaylistCommand': 'removeFromPlaylistCommand',
        'prop(items)': '.playlistsViewModel.playlists',
        '-fetchData': '.playlistsViewModel.bind(fetchData)',
        'prop(playlists)': 'playlists'
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

