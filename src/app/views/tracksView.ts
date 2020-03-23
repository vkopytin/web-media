import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/tracks';
import { current } from '../utils';
import { PlaylistsViewModel, PlaylistsViewModelItem, TrackViewModelItem } from '../viewModels';


export interface ITracksViewProps {
    className?: string;
    playlist: PlaylistsViewModelItem;
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class TracksView extends BaseView<ITracksViewProps, TracksView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        openLogin: false,
        tracks: [] as TrackViewModelItem[],
        likedTracks: [] as TrackViewModelItem[],
        selectedItem: null as TrackViewModelItem,
        trackLyrics: null as { trackId: string; lyrics: string }
    };

    likeTrackCommand = { exec(track: TrackViewModelItem) { throw new Error('Not bound command'); } };
    unlikeTrackCommand = { exec(track: TrackViewModelItem) { throw new Error('Not bound command'); } };
    findTrackLyricsCommand = { exec(track: TrackViewModelItem) { throw new Error('Not bound command'); } };

    binding = bindTo(this, () => current(PlaylistsViewModel), {
        'findTrackLyricsCommand': 'findTrackLyricsCommand',
        'likeTrackCommand': 'likeTrackCommand',
        'unlikeTrackCommand': 'unlikeTrackCommand',
        'prop(tracks)': 'tracks',
        'prop(likedTracks)': 'likedTracks',
        'prop(selectedItem)': 'selectedItem',
        'prop(trackLyrics)': 'prop(trackLyrics)'
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

    uri() {
        return this.props.playlist.uri();
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.prop('errors')) {
            this.prop('errors', val);
            this.props.showErrors(val);
        }

        return this.prop('errors');
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    render() {
        return template(this);
    }
}

export { TracksView };

