import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import * as _ from 'underscore';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/myTracks';
import { current } from '../utils';
import { MyTracksViewModel, TrackViewModelItem } from '../viewModels';


export interface IMyTracksViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    loadMore?: boolean;
    currentTrackId: string;
}

class MyTracksView extends BaseView<IMyTracksViewProps, MyTracksView['state']> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        term: '',
        items: [] as TrackViewModelItem[],
        isLoading: false,
        currentTrackId: '',
        likedTracks: [] as TrackViewModelItem[],
        selectedItem: null as TrackViewModelItem,
        trackLyrics: null as { trackId: string; lyrics: string },
    };

    loadMoreCommand = { exec() { } };
    findTrackLyricsCommand = { exec(track: TrackViewModelItem) { throw new Error('Not bound command'); } };
    
    binding = bindTo(this, () => current(MyTracksViewModel), {
        'loadMoreCommand': 'loadMoreCommand',
        'findTrackLyricsCommand': 'findTrackLyricsCommand',
        'prop(items)': 'tracks',
        'prop(likedTracks)': 'likedTracks',
        'prop(isLoading)': 'isLoading',
        'prop(selectedItem)': 'selectedItem',
        'prop(trackLyrics)': 'prop(trackLyrics)'
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    render() {
        return template(this);
    }
}

export { MyTracksView };

