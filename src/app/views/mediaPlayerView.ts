import * as React from 'react';
import { template } from '../templates/mediaPlayer';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    MediaPlayerViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current, formatTime } from '../utils';
import * as _ from 'underscore';


export interface IMediaPlayerViewProps {

}

class MediaPlayerView extends withEvents(React.Component)<IMediaPlayerViewProps, {}> {
    state = {
        queue: [] as TrackViewModelItem[],
        duration: 1,
        timePlayed: 100,
        isPlaying: false,
        trackName: '',
        albumName: ''
    };

    resumeCommand = { exec() { } };
    pauseCommand = { exec() { } };
    prevCommand = { exec() { } };
    nextCommand = { exec() { } };
    volumeUpCommand = { exec() { } };
    volumeDownCommand = { exec() { } };
    refreshPlayback = { exec() { } };
    
    binding = bindTo(this, () => current(MediaPlayerViewModel), {
        'resumeCommand': 'resumeCommand',
        'pauseCommand': 'pauseCommand',
        'prevCommand': 'prevCommand',
        'nextCommand': 'nextCommand',
        'volumeUpCommand': 'volumeUpCommand',
        'volumeDownCommand': 'volumeDownCommand',
        'refreshPlayback': 'refreshPlayback',
        'prop(queue)': 'queue',
        'prop(currentPlayback)': 'playbackInfo',
        'prop(timePlayed)': 'timePlayed',
        'prop(duration)': 'duration',
        'prop(isPlaying)': 'isPlaying',
        'prop(trackName)': 'trackName',
        'prop(albumName)': 'albumName'
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

    timePlayed() {
        const played = this.prop('timePlayed'),
            duration = this.prop('duration');

        return played / duration * 100;
    }

    titlePlayed() {
        return formatTime(this.prop('timePlayed'));
    }

    titleLeft() {
        return formatTime(this.prop('duration') - this.prop('timePlayed'));
    }

    render() {
        return template(this);
    }
}

export { MediaPlayerView };
