import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/pickPlaylist';
import { current } from '../utils';
import { HomeViewModel, PlaylistsViewModel, PlaylistsViewModelItem } from '../viewModels';


export interface IPickPlaylistsViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PickPlaylistsView extends BaseView<IPickPlaylistsViewProps, PickPlaylistsView['state'], {}> {
    playlistsViewModel = current(PlaylistsViewModel);

    state = {
        errors: [] as ServiceResult<any, Error>[],
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PickPlaylistsView };

