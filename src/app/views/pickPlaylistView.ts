import * as _ from 'underscore';
import { BaseView } from '../base/baseView';
import { template } from '../templates/pickPlaylist';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    DeviceViewModelItem,
    PlaylistsViewModel,
    PlaylistsViewModelItem,
    TrackViewModelItem,
    HomeViewModel
} from '../viewModels';
import { current } from '../utils';


export interface IPickPlaylistsViewProps {

}

class PickPlaylistsView extends BaseView<IPickPlaylistsViewProps, PickPlaylistsView['state'], {}> {
    playlistsViewModel = current(PlaylistsViewModel);

    state = {
        items: [] as PlaylistsViewModelItem[],
        selectedPlaylist: null as PlaylistsViewModelItem
    };

    binding = bindTo(this, () => current(HomeViewModel), {
        'prop(items)': '.playlistsViewModel.playlists',
        'prop(selectedPlaylist)': 'selectedPlaylist'
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

    componentDidUpdate(prevProps: IPickPlaylistsViewProps, prevState, snapshot) {
    }

    render() {
        return template(this);
    }
}

export { PickPlaylistsView };
