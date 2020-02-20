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

}

class SearchView extends withEvents(React.Component)<ISearchViewProps, {}> {
    state = {
        term: '',
        items: [] as TrackViewModelItem[]
    };
    
    binding = bindTo(this, () => current(SearchViewModel), {
        'prop(term)': 'term',
        'prop(items)': 'tracks'
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

    prop<K extends keyof SearchView['state']>(propName: K, val?: SearchView['state'][K]): SearchView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    render() {
        return template(this);
    }
}

export { SearchView };
