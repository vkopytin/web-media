import * as $ from 'jquery';
import * as React from 'react';
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

class MyTracksView extends withEvents(React.Component)<IMyTracksViewProps, {}> {
    state = {
        term: '',
        items: [] as TrackViewModelItem[],
        isLoading: false,
        currentTrackId: ''
    };

    loadMoreCommand = { exec() { } };
    
    binding = bindTo(this, () => current(MyTracksViewModel), {
        'loadMoreCommand': 'loadMoreCommand',
        'prop(items)': 'tracks',
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

    prop<K extends keyof MyTracksView['state']>(propName: K, val?: MyTracksView['state'][K]): MyTracksView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    render() {
        return template(this);
    }
}

export { MyTracksView };
