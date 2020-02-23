import * as React from 'react';
import { template } from '../templates/search';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    SearchViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';
import * as _ from 'underscore';


export interface ISearchViewProps {
    loadMore?: boolean;
    currentTrackId: string;
}

class SearchView extends withEvents(React.Component)<ISearchViewProps, {}> {
    state = {
        term: '',
        items: [] as TrackViewModelItem[]
    };

    loadMoreCommand = { exec() { } };
    
    binding = bindTo(this, () => current(SearchViewModel), {
        'prop(term)': 'term',
        'prop(items)': 'tracks',
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

    prop<K extends keyof SearchView['state']>(propName: K, val?: SearchView['state'][K]): SearchView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    isPlaying(track: TrackViewModelItem) {
        return track.id() === this.props.currentTrackId;
    }

    render() {
        return template(this);
    }
}

export { SearchView };
