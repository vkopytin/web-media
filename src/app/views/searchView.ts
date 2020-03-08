import { BaseView } from '../base/baseView';
import { template } from '../templates/search';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    SearchViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';
import * as _ from 'underscore';
import { ISearchType } from '../adapter/spotify';


export interface ISearchViewProps {
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends BaseView<ISearchViewProps, SearchView['state']> {
    state = {
        term: '',
        items: [] as TrackViewModelItem[],
        searchType: 'track' as ISearchType
    };

    loadMoreCommand = { exec() { } };
    
    binding = bindTo(this, () => current(SearchViewModel), {
        'prop(term)': 'term',
        'prop(items)': 'tracks',
        'prop(searchType)': 'searchType',
        'loadMoreCommand': 'loadMoreCommand'
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

    componentDidUpdate(prevProps: ISearchViewProps, prevState, snapshot) {
        if (this.props.loadMore) {
            this.loadMoreCommand.exec();
        }
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    render() {
        return template(this);
    }
}

export { SearchView };
