import { BaseView } from '../base/baseView';
import { template } from '../templates/albums';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    TrackViewModelItem,
    AlbumViewModelItem,
    NewReleasesViewModel
} from '../viewModels';
import { current } from '../utils';


export interface IAlbumsViewProps {
    album: AlbumViewModelItem;
    currentTrackId: string;
}

class AlbumsView extends BaseView<IAlbumsViewProps, AlbumsView['state']> {
    state = {
        openLogin: false,
        tracks: [] as TrackViewModelItem[],
    };
    binding = bindTo(this, () => current(NewReleasesViewModel), {
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

    uri() {
        return this.props.album.uri();
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    render() {
        return template(this);
    }
}

export { AlbumsView };
