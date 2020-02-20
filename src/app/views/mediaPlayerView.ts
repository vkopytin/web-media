import * as React from 'react';
import { template } from '../templates/mediaPlayer';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    MediaPlayerViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current } from '../utils';
import * as _ from 'underscore';


export interface IMediaPlayerViewProps {

}

class MediaPlayerView extends withEvents(React.Component)<IMediaPlayerViewProps, {}> {
    state = {
        queue: [] as TrackViewModelItem[]
    };

    resumeCommand = { exec() { } };

    pauseCommand = { exec() { } }

    prevCommand = { exec() { } }

    nextCommand = { exec() { } }

    volumeUpCommand = { exec() { } }

    volumeDownCommand = { exec() { } }
    
    binding = bindTo(this, () => current(MediaPlayerViewModel), {
        'resumeCommand': 'resumeCommand',
        'pauseCommand': 'pauseCommand',
        'prevCommand': 'prevCommand',
        'nextCommand': 'nextCommand',
        'volumeUpCommand': 'volumeUpCommand',
        'volumeDownCommand': 'volumeDownCommand',
        'prop(queue)': 'queue'
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

    prop<K extends keyof MediaPlayerView['state']>(propName: K, val?: MediaPlayerView['state'][K]): MediaPlayerView['state'][K] {
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

export { MediaPlayerView };
