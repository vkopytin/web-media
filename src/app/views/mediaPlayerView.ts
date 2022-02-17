import React from 'react';
import { BehaviorSubject, merge, Subject, Subscription } from 'rxjs';
import { map, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/mediaPlayer';
import { Binding, current, formatTime, Notify } from '../utils';
import { MediaPlayerViewModel } from '../viewModels';

export interface IMediaPlayerViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    currentTrackId$: BehaviorSubject<string>;
}

class MediaPlayerView extends React.Component<IMediaPlayerViewProps> {
    didRefresh: MediaPlayerView['refresh'] = () => { };
    vm = current(MediaPlayerViewModel);

    errors$ = this.vm.errors$;
    @Binding({
        didSet: (view, errors) => {
            view.didRefresh();
            view.showErrors(errors);
        }
    })
    errors: MediaPlayerView['vm']['errors'];

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding({ didSet: (view) => view.didRefresh() })
    currentTrackId: MediaPlayerView['vm']['currentTrackId'];

    queue$ = this.vm.queue$;
    @Binding({ didSet: (view) => view.didRefresh() })
    queue: MediaPlayerView['vm']['queue'];

    timePlayed$ = this.vm.timePlayed$;
    @Binding({ didSet: (view) => view.didRefresh() })
    timePlayed: MediaPlayerView['vm']['timePlayed'];

    duration$ = this.vm.duration$;
    @Binding({ didSet: (view) => view.didRefresh() })
    duration: MediaPlayerView['vm']['duration'];

    isPlaying$ = this.vm.isPlaying$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isPlaying: MediaPlayerView['vm']['isPlaying'];

    trackName$ = this.vm.trackName$;
    @Binding({ didSet: (view) => view.didRefresh() })
    trackName: MediaPlayerView['vm']['trackName'];

    albumName$ = this.vm.albumName$;
    @Binding({ didSet: (view) => view.didRefresh() })
    albumName: MediaPlayerView['vm']['albumName'];

    artistName$ = this.vm.artistName$;
    @Binding({ didSet: (view) => view.didRefresh() })
    artistName: MediaPlayerView['vm']['artistName'];

    volume$ = this.vm.volume$;
    @Binding({ didSet: (view) => view.didRefresh() })
    volume: MediaPlayerView['vm']['volume'];

    thumbnailUrl$ = this.vm.thumbnailUrl$;
    @Binding({ didSet: (view) => view.didRefresh() })
    thumbnailUrl: MediaPlayerView['vm']['thumbnailUrl'];

    isLiked$ = this.vm.isLiked$;
    @Binding({ didSet: (view) => view.didRefresh() })
    isLiked: MediaPlayerView['vm']['isLiked'];

    resumeCommand$ = this.vm.resumeCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    resumeCommand: MediaPlayerView['vm']['resumeCommand'];

    pauseCommand$ = this.vm.pauseCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    pauseCommand: MediaPlayerView['vm']['pauseCommand'];

    prevCommand$ = this.vm.prevCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    prevCommand: MediaPlayerView['vm']['prevCommand'];

    nextCommand$ = this.vm.nextCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    nextCommand: MediaPlayerView['vm']['nextCommand'];

    volumeUpCommand$ = this.vm.volumeUpCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    volumeUpCommand: MediaPlayerView['vm']['volumeUpCommand'];

    volumeDownCommand$ = this.vm.volumeDownCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    volumeDownCommand : MediaPlayerView['vm']['volumeDownCommand'];

    refreshPlaybackCommand$ = this.vm.refreshPlaybackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    refreshPlaybackCommand: MediaPlayerView['vm']['refreshPlaybackCommand'];

    likeSongCommand$ = this.vm.likeSongCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    likeSongCommand: MediaPlayerView['vm']['likeSongCommand'];

    unlikeSongCommand$ = this.vm.unlikeSongCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    unlikeSongCommand: MediaPlayerView['vm']['unlikeSongCommand'];

    seekPlaybackCommand$ = this.vm.seekPlaybackCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    seekPlaybackCommand: MediaPlayerView['vm']['seekPlaybackCommand'];

    volumeCommand$ = this.vm.volumeCommand$;
    @Binding({ didSet: (view) => view.didRefresh() })
    volumeCommand: MediaPlayerView['vm']['volumeCommand'];
    
    constructor(props) {
        super(props);
        // toDO: Find better solution
        this.currentTrackId$ = this.props.currentTrackId$;
    }

    componentDidMount() {
        Notify.subscribeChildren(this.refresh, this);
        this.didRefresh = this.refresh;
    }

    componentWillUnmount() {
        Notify.unsubscribeChildren(this.refresh, this);
        this.didRefresh = () => { };
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

    showErrors(errors) {
        this.props.showErrors(errors);
    }

    logslider(position) {
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

    logposition(value) {
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

