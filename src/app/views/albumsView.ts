import { BaseView } from '../base/baseView';
import { template } from '../templates/albums';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    TrackViewModelItem,
    AlbumViewModelItem
} from '../viewModels';


export interface IAlbumsViewProps {
    uri: string;
    currentTrackId: string;
    tracks: TrackViewModelItem[];
}

class AlbumsView extends BaseView<IAlbumsViewProps, AlbumsView['state']> {
    state = {
        openLogin: false,
        tracks: [] as TrackViewModelItem[],
    };
    binding = bindTo(this, () => {
        tracks: [] as TrackViewModelItem[]
    }, {
        'prop(tracks)': 'tracks'
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

    componentDidUpdate(prevProps: IAlbumsViewProps, prevState, snapshot) {
        this.prop('tracks', this.props.tracks);
    }

    uri() {
        return this.props.uri;
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    render() {
        return template(this);
    }
}

export { AlbumsView };
