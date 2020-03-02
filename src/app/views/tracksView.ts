import { BaseView } from '../base/baseView';
import { template } from '../templates/tracks';
import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import {
    PlaylistsViewModel,
    TrackViewModelItem,
    PlaylistsViewModelItem,
    AlbumViewModelItem
} from '../viewModels';
import { current } from '../utils';
import { ServiceResult } from '../base/serviceResult';


export interface ITracksViewProps {
    playlist: PlaylistsViewModelItem;
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class TracksView extends BaseView<ITracksViewProps, {}> {
    state = {
        openLogin: false,
        tracks: [] as TrackViewModelItem[],
        likedTracks: [] as TrackViewModelItem[],
        errors: [] as ServiceResult<any, Error>[]
    };
    binding = bindTo(this, () => current(PlaylistsViewModel), {
        'prop(tracks)': 'tracks',
        'prop(likedTracks)': 'likedTracks'
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

    prop<K extends keyof TracksView['state']>(propName: K, val?: TracksView['state'][K]): TracksView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
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
