import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/home';
import { current } from '../utils';
import { HomeViewModel, TrackViewModelItem } from '../viewModels';


export interface IHomeViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}


class HomeView extends BaseView<IHomeViewProps, HomeView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        openLogin: false,
        isLoading: false,
        items: [] as TrackViewModelItem[],
        likedTracks: [] as TrackViewModelItem[],
        selectedItem: null as TrackViewModelItem
    };

    refreshCommand = { exec() { } };
    selectTrackCommand = { exec(track: TrackViewModelItem) { } };
    likeTrackCommand = { exec(track: TrackViewModelItem) { } };
    unlikeTrackCommand = { exec(track: TrackViewModelItem) { } };

    binding = bindTo(this, () => current(HomeViewModel), {
        '-errors': 'errors',
        'refreshCommand': 'refreshCommand',
        'selectTrackCommand': 'selectTrackCommand',
        'likeTrackCommand': 'likeTrackCommand',
        'unlikeTrackCommand': 'unlikeTrackCommand',
        'prop(items)': 'tracks',
        'prop(likedTracks)': 'likedTracks',
        'prop(isLoading)': 'prop(isLoading)',
        'prop(selectedItem)': 'prop(selectedTrack)'
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

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { HomeView };

