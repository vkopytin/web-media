import * as React from 'react';
import { template } from '../templates/mediaPlayer';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import {
    MediaPlayerViewModel,
    TrackViewModelItem
} from '../viewModels';
import { current, formatTime } from '../utils';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';


export interface IMediaPlayerViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    currentTrackId(val?: string);
}

class MediaPlayerView extends withEvents(React.Component)<IMediaPlayerViewProps, {}> {
    state = {
        queue: [] as TrackViewModelItem[],
        duration: 1,
        timePlayed: 100,
        isPlaying: false,
        volume: 80,
        trackName: '',
        albumName: '',
        errors: [] as ServiceResult<any, Error>[],
        thumbnailUrl: '',
        isLiked: false
    };

    resumeCommand = { exec() { } };
    pauseCommand = { exec() { } };
    prevCommand = { exec() { } };
    nextCommand = { exec() { } };
    volumeUpCommand = { exec() { } };
    volumeDownCommand = { exec() { } };
    refreshPlaybackCommand = { exec() { } };
    likeSongCommand = { exec() { } };
    unlikeSongCommand = { exec() { } };
    seekPlaybackCommand = { exec(percent) { } };
    volumeCommand = { exec(percent) { } };
    
    binding = bindTo(this, () => current(MediaPlayerViewModel), {
        'resumeCommand': 'resumeCommand',
        'pauseCommand': 'pauseCommand',
        'prevCommand': 'prevCommand',
        'nextCommand': 'nextCommand',
        'volumeCommand': 'volumeCommand',
        'volumeUpCommand': 'volumeUpCommand',
        'volumeDownCommand': 'volumeDownCommand',
        'refreshPlaybackCommand': 'refreshPlaybackCommand',
        'likeSongCommand': 'likeSongCommand',
        'unlikeSongCommand': 'unlikeSongCommand',
        'seekPlaybackCommand': 'seekPlaybackCommand',
        'prop(queue)': 'queue',
        'prop(currentPlayback)': 'playbackInfo',
        'prop(timePlayed)': 'timePlayed',
        'prop(duration)': 'duration',
        'prop(isPlaying)': 'isPlaying',
        'prop(trackName)': 'trackName',
        'prop(albumName)': 'albumName',
        'prop(volume)': 'volume',
        'prop(thumbnailUrl)': 'thumbnailUrl',
        'prop(isLiked)': 'isLiked',
        'errors': 'errors',
        'props.currentTrackId': 'currentTrackId'
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

    seekTrack(evnt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        const rect = (evnt.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = evnt.clientX - rect.left; //x position within the element.
        const y = evnt.clientY - rect.top;  //y position within the element.
        const progressPercent = x / rect.width * 100;

        this.seekPlaybackCommand.exec(Math.round(progressPercent));
    }

    updateVolume(evnt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        const rect = (evnt.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = evnt.clientX - rect.left; //x position within the element.
        const y = evnt.clientY - rect.top;  //y position within the element.
        const progressPercent = x / rect.width * 100;

        this.volumeCommand.exec(Math.round(progressPercent));
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

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.prop('errors')) {
            this.prop('errors', val);
            this.props.showErrors(val);
        }

        return this.prop('errors');
    }

    render() {
        return template(this);
    }
}

export { MediaPlayerView };
