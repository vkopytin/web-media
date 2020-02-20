import * as React from 'react';
import { template } from '../templates/home';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    HomeViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';


export interface IHomeViewProps {

}

class HomeView extends withEvents(React.Component)<IHomeViewProps, {}> {
    state = {
        openLogin: false,
        items: [] as TrackViewModelItem[]
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

    render() {
        return template(this);
    }
}

export { HomeView };
