import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/mediaPlayer';
import { Binding, current, formatTime, Notifications } from '../utils';
import { Result } from '../utils/result';
import { AppViewModel, MediaPlayerViewModel } from '../viewModels';

export interface IMediaPlayerViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
}

class MediaPlayerView extends React.Component<IMediaPlayerViewProps> {
    didRefresh: MediaPlayerView['refresh'] = this.refresh.bind(this);
    vm = current(MediaPlayerViewModel);

    @Binding((a: MediaPlayerView) => a.vm, 'errors', {
        didSet: (view, errors) => view.showErrors(errors as Result<Error>[])
    })
    errors!: MediaPlayerView['vm']['errors'];

    @Binding(() => current(AppViewModel), 'currentTrackId')
    currentTrackId!: MediaPlayerView['vm']['currentTrackId'];

    @Binding((a: MediaPlayerView) => a.vm, 'queue')
    queue!: MediaPlayerView['vm']['queue'];

    @Binding((a: MediaPlayerView) => a.vm, 'timePlayed')
    timePlayed!: MediaPlayerView['vm']['timePlayed'];

    @Binding((a: MediaPlayerView) => a.vm, 'duration')
    duration!: MediaPlayerView['vm']['duration'];

    @Binding((a: MediaPlayerView) => a.vm, 'isPlaying')
    isPlaying!: MediaPlayerView['vm']['isPlaying'];

    @Binding((a: MediaPlayerView) => a.vm, 'trackName')
    trackName!: MediaPlayerView['vm']['trackName'];

    @Binding((a: MediaPlayerView) => a.vm, 'albumName')
    albumName!: MediaPlayerView['vm']['albumName'];

    @Binding((a: MediaPlayerView) => a.vm, 'artistName')
    artistName!: MediaPlayerView['vm']['artistName'];

    @Binding((a: MediaPlayerView) => a.vm, 'volume')
    volume!: MediaPlayerView['vm']['volume'];

    @Binding((a: MediaPlayerView) => a.vm, 'thumbnailUrl')
    thumbnailUrl!: MediaPlayerView['vm']['thumbnailUrl'];

    @Binding((a: MediaPlayerView) => a.vm, 'isLiked')
    isLiked!: MediaPlayerView['vm']['isLiked'];

    @Binding((a: MediaPlayerView) => a.vm, 'resumeCommand')
    resumeCommand!: MediaPlayerView['vm']['resumeCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'pauseCommand')
    pauseCommand!: MediaPlayerView['vm']['pauseCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'prevCommand')
    prevCommand!: MediaPlayerView['vm']['prevCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'nextCommand')
    nextCommand!: MediaPlayerView['vm']['nextCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'volumeCommand')
    volumeUpCommand!: MediaPlayerView['vm']['volumeUpCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'volumeDownCommand')
    volumeDownCommand!: MediaPlayerView['vm']['volumeDownCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'refreshPlaybackCommand')
    refreshPlaybackCommand!: MediaPlayerView['vm']['refreshPlaybackCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'likeSongCommand')
    likeSongCommand!: MediaPlayerView['vm']['likeSongCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'unlikeSongCommand')
    unlikeSongCommand!: MediaPlayerView['vm']['unlikeSongCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'seekPlaybackCommand')
    seekPlaybackCommand!: MediaPlayerView['vm']['seekPlaybackCommand'];

    @Binding((a: MediaPlayerView) => a.vm, 'volumeCommand')
    volumeCommand!: MediaPlayerView['vm']['volumeCommand'];

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh() {
        this.setState({
            ...this.state,
        });
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
        const progressPercent = this.logslider(x / rect.width * 100);

        this.volumeCommand.exec(Math.round(progressPercent));
    }

    getVolume() {
        return this.logposition(this.volume);
    }

    titlePlayed() {
        return formatTime(this.timePlayed);
    }

    titleLeft() {
        return formatTime(this.duration - this.timePlayed);
    }

    showErrors(errors: Result<Error>[]) {
        this.props.showErrors(errors);
    }

    logslider(position: number) {
        // position will be between 0 and 100
        var minp = 0;
        var maxp = 100;

        // The result should be between 100 an 10000000
        var minv = Math.log(1);
        var maxv = Math.log(100);

        // calculate adjustment factor
        var scale = (maxv - minv) / (maxp - minp);

        return Math.exp(minv + scale * (position - minp));
    }

    logposition(value: number) {
        // position will be between 0 and 100
        var minp = 0;
        var maxp = 100;

        // The result should be between 100 an 10000000
        var minv = Math.log(1);
        var maxv = Math.log(100);

        // calculate adjustment factor
        var scale = (maxv - minv) / (maxp - minp);

        return (Math.log(value) - minv) / scale + minp;
    }

    render() {
        return template(this);
    }
}

export { MediaPlayerView };

