import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/mediaPlayer';
import { Binding, current, formatTime, Notifications } from '../utils';
import { Result } from '../utils/result';
import { MediaPlayerViewModel } from '../viewModels';

export interface IMediaPlayerViewProps {
    showErrors<T>(errors: Result<Error, T>[]): void;
    currentTrackId$: BehaviorSubject<string>;
}

class MediaPlayerView extends React.Component<IMediaPlayerViewProps> {
    didRefresh: MediaPlayerView['refresh'] = this.refresh.bind(this);
    vm = current(MediaPlayerViewModel);

    errors$ = this.vm.errors$;
    @Binding<MediaPlayerView>({ didSet: (view, errors) => view.showErrors(errors) })
    errors!: MediaPlayerView['vm']['errors'];

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding()
    currentTrackId!: MediaPlayerView['vm']['currentTrackId'];

    queue$ = this.vm.queue$;
    @Binding()
    queue!: MediaPlayerView['vm']['queue'];

    timePlayed$ = this.vm.timePlayed$;
    @Binding()
    timePlayed!: MediaPlayerView['vm']['timePlayed'];

    duration$ = this.vm.duration$;
    @Binding()
    duration!: MediaPlayerView['vm']['duration'];

    isPlaying$ = this.vm.isPlaying$;
    @Binding()
    isPlaying!: MediaPlayerView['vm']['isPlaying'];

    trackName$ = this.vm.trackName$;
    @Binding()
    trackName!: MediaPlayerView['vm']['trackName'];

    albumName$ = this.vm.albumName$;
    @Binding()
    albumName!: MediaPlayerView['vm']['albumName'];

    artistName$ = this.vm.artistName$;
    @Binding()
    artistName!: MediaPlayerView['vm']['artistName'];

    volume$ = this.vm.volume$;
    @Binding()
    volume!: MediaPlayerView['vm']['volume'];

    thumbnailUrl$ = this.vm.thumbnailUrl$;
    @Binding()
    thumbnailUrl!: MediaPlayerView['vm']['thumbnailUrl'];

    isLiked$ = this.vm.isLiked$;
    @Binding()
    isLiked!: MediaPlayerView['vm']['isLiked'];

    resumeCommand$ = this.vm.resumeCommand$;
    @Binding()
    resumeCommand!: MediaPlayerView['vm']['resumeCommand'];

    pauseCommand$ = this.vm.pauseCommand$;
    @Binding()
    pauseCommand!: MediaPlayerView['vm']['pauseCommand'];

    prevCommand$ = this.vm.prevCommand$;
    @Binding()
    prevCommand!: MediaPlayerView['vm']['prevCommand'];

    nextCommand$ = this.vm.nextCommand$;
    @Binding()
    nextCommand!: MediaPlayerView['vm']['nextCommand'];

    volumeUpCommand$ = this.vm.volumeUpCommand$;
    @Binding()
    volumeUpCommand!: MediaPlayerView['vm']['volumeUpCommand'];

    volumeDownCommand$ = this.vm.volumeDownCommand$;
    @Binding()
    volumeDownCommand!: MediaPlayerView['vm']['volumeDownCommand'];

    refreshPlaybackCommand$ = this.vm.refreshPlaybackCommand$;
    @Binding()
    refreshPlaybackCommand!: MediaPlayerView['vm']['refreshPlaybackCommand'];

    likeSongCommand$ = this.vm.likeSongCommand$;
    @Binding()
    likeSongCommand!: MediaPlayerView['vm']['likeSongCommand'];

    unlikeSongCommand$ = this.vm.unlikeSongCommand$;
    @Binding()
    unlikeSongCommand!: MediaPlayerView['vm']['unlikeSongCommand'];

    seekPlaybackCommand$ = this.vm.seekPlaybackCommand$;
    @Binding()
    seekPlaybackCommand!: MediaPlayerView['vm']['seekPlaybackCommand'];

    volumeCommand$ = this.vm.volumeCommand$;
    @Binding()
    volumeCommand!: MediaPlayerView['vm']['volumeCommand'];

    constructor(props: IMediaPlayerViewProps) {
        super(props);
        // toDO: Find better solution
        this.currentTrackId$ = this.props.currentTrackId$;
    }

    componentDidMount() {
        Notifications.observe(this, this.didRefresh);
    }

    componentWillUnmount() {
        Notifications.stopObserving(this, this.didRefresh);
    }

    refresh(args: { inst: MediaPlayerView['errors$']; value: Result<Error>[] }) {
        if (args?.inst === this.errors$) {
            this.showErrors(args.value);
        }
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

