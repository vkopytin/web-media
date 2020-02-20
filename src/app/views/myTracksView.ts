import * as React from 'react';
import { template } from '../templates/myTracks';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    MyTracksViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';
import * as _ from 'underscore';


export interface ISearchViewProps {

}

class MyTracksView extends withEvents(React.Component)<ISearchViewProps, {}> {
    state = {
        term: '',
        items: [] as TrackViewModelItem[]
    };
    
    binding = bindTo(this, () => current(MyTracksViewModel), {
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

    prop<K extends keyof MyTracksView['state']>(propName: K, val?: MyTracksView['state'][K]): MyTracksView['state'][K] {
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

export { MyTracksView };
