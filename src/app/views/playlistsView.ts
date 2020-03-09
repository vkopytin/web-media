import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/playlists';
import { current } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface IPlaylistsViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class PlaylistsView extends BaseView<IPlaylistsViewProps, PlaylistsView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
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
        '-errors': 'errors',
        'loadMoreCommand': 'loadMoreCommand',
        'loadMoreTracksCommand': 'loadMoreTracksCommand',
        'selectPlaylistCommand': 'selectPlaylistCommand',
        'createPlaylistCommand': 'createPlaylistCommand',
        'prop(playlists)': 'playlists',
        'prop(tracks)': 'tracks',
        'prop(isLoading)': 'isLoading',
        'prop(likedTracks)': 'likedTracks',
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { PlaylistsView };

