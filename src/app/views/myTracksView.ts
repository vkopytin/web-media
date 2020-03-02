import { BaseView } from '../base/baseView';
import { template } from '../templates/myTracks';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    MyTracksViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';
import * as _ from 'underscore';


export interface IMyTracksViewProps {
    loadMore?: boolean;
    currentTrackId: string;
}

class MyTracksView extends BaseView<IMyTracksViewProps, MyTracksView['state']> {
    state = {
        term: '',
        items: [] as TrackViewModelItem[],
        isLoading: false,
        currentTrackId: '',
        likedTracks: [] as TrackViewModelItem[]
    };

    loadMoreCommand = { exec() { } };
    
    binding = bindTo(this, () => current(MyTracksViewModel), {
        'loadMoreCommand': 'loadMoreCommand',
        'prop(items)': 'tracks',
        'prop(likedTracks)': 'likedTracks',
        'prop(isLoading)': 'isLoading'
    });

    searchTracks = _.debounce(term => {
        this.prop('term', term);
    }, 500);

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

    componentDidUpdate(prevProps: IMyTracksViewProps, prevState, snapshot) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
        this.prop('currentTrackId', this.props.currentTrackId);
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    render() {
        return template(this);
    }
}

export { MyTracksView };
