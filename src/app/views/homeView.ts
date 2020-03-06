import { BaseView } from '../base/baseView';
import { template } from '../templates/home';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    HomeViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';
import { ServiceResult } from '../base/serviceResult';


export interface IHomeViewProps {
    currentTrackId: string;
    showErrors(errors: ServiceResult<any, Error>[]);
}

class HomeView extends BaseView<IHomeViewProps, HomeView['state']> {
    state = {
        openLogin: false,
        items: [] as TrackViewModelItem[],
        errors: [] as ServiceResult<any, Error>[],
        likedTracks: [] as TrackViewModelItem[]
    };

    refreshCommand = { exec() { } };
    
    binding = bindTo(this, () => current(HomeViewModel), {
        'prop(items)': 'tracks',
        'prop(likedTracks)': 'likedTracks',
        'refreshCommand': 'refreshCommand',
        '-errors': 'errors'
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
