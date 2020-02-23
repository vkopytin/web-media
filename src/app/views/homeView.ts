import * as React from 'react';
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

class HomeView extends withEvents(React.Component)<IHomeViewProps, {}> {
    state = {
        openLogin: false,
        items: [] as TrackViewModelItem[],
        errors: [] as ServiceResult<any, Error>[]
    };

    refreshCommand = { exec() { } };
    
    binding = bindTo(this, () => current(HomeViewModel), {
        'prop(items)': 'tracks',
        'refreshCommand': 'refreshCommand'
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

    prop<K extends keyof HomeView['state']>(propName: K, val?: HomeView['state'][K]): HomeView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.prop('errors')) {
            this.prop('errors', val);
            this.props.showErrors(val);
        }

        return this.prop('errors');
    }

    isPlaying(track: TrackViewModelItem) {
        return this.props.currentTrackId === track.id();
    }

    render() {
        return template(this);
    }
}

export { HomeView };
