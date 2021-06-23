import { bindTo, subscribeToChange, unbindFrom, updateLayout } from 'databindjs';
import { BehaviorSubject, of, Subject, Subscription, merge } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { BaseView } from '../base/baseView';
import { ServiceResult } from '../base/serviceResult';
import { template } from '../templates/mediaPlayer';
import { Binding, current, formatTime } from '../utils';
import { MediaPlayerViewModel, TrackViewModelItem } from '../viewModels';
import *as _ from 'underscore';

export interface IMediaPlayerViewProps {
    showErrors(errors: ServiceResult<any, Error>[]);
    currentTrackId$: BehaviorSubject<string>;
}

class MediaPlayerView extends BaseView<IMediaPlayerViewProps, MediaPlayerView['state']> {
    vm = current(MediaPlayerViewModel);

    errors$ = this.vm.errors$;
    @Binding errors = this.errors$.getValue();

    currentTrackId$ = this.vm.currentTrackId$;
    @Binding currentTrackId = this.currentTrackId$.getValue();

    queue$ = this.vm.queue$;
    @Binding queue = this.queue$.getValue();

    timePlayed$ = this.vm.timePlayed$;
    @Binding timePlayed = this.timePlayed$.getValue();

    duration$ = this.vm.duration$;
    @Binding duration = this.duration$.getValue();

    isPlaying$ = this.vm.isPlaying$;
    @Binding isPlaying = this.isPlaying$.getValue();

    trackName$ = this.vm.trackName$;
    @Binding trackName = this.trackName$.getValue();

    albumName$ = this.vm.albumName$;
    @Binding albumName = this.albumName$.getValue();

    artistName$ = this.vm.artistName$;
    @Binding artistName = this.artistName$.getValue();

    volume$ = this.vm.volume$;
    @Binding volume = this.volume$.getValue();

    thumbnailUrl$ = this.vm.thumbnailUrl$;
    @Binding thumbnailUrl = this.thumbnailUrl$.getValue();

    isLiked$ = this.vm.isLiked$;
    @Binding isLiked = this.isLiked$.getValue();

    state = {
    };

    resumeCommand$ = this.vm.resumeCommand$;
    @Binding resumeCommand = this.resumeCommand$.getValue();
    pauseCommand$ = this.vm.pauseCommand$;
    @Binding pauseCommand = this.pauseCommand$.getValue();
    prevCommand$ = this.vm.prevCommand$;
    @Binding prevCommand = this.prevCommand$.getValue();
    nextCommand$ = this.vm.nextCommand$;
    @Binding nextCommand = this.nextCommand$.getValue();
    volumeUpCommand$ = this.vm.volumeUpCommand$;
    @Binding volumeUpCommand = this.volumeUpCommand$.getValue();
    volumeDownCommand$ = this.vm.volumeDownCommand$;
    @Binding volumeDownCommand = this.volumeDownCommand$.getValue();
    refreshPlaybackCommand$ = this.vm.refreshPlaybackCommand$;
    @Binding refreshPlaybackCommand = this.refreshPlaybackCommand$.getValue();
    likeSongCommand$ = this.vm.likeSongCommand$;
    @Binding likeSongCommand = this.likeSongCommand$.getValue();
    unlikeSongCommand$ = this.vm.unlikeSongCommand$;
    @Binding unlikeSongCommand = this.unlikeSongCommand$.getValue();
    seekPlaybackCommand$ = this.vm.seekPlaybackCommand$;
    @Binding seekPlaybackCommand = this.seekPlaybackCommand$.getValue();
    volumeCommand$ = this.vm.volumeCommand$;
    @Binding volumeCommand = this.volumeCommand$.getValue();
    
    dispose$ = new Subject<void>();
    disposeSubscription: Subscription;

    constructor(props) {
        super(props);
        // toDO: Find better solution
        this.props.currentTrackId$.pipe(
            map(trackId => this.currentTrackId = trackId)
        ).subscribe();
        this.currentTrackId$.pipe(
            map(trackId => this.props.currentTrackId$.next(trackId))
        ).subscribe();
    }

    componentDidMount() {
        this.disposeSubscription = merge(
            this.errors$.pipe(map(errors => ({ errors }))),
            this.currentTrackId$.pipe(map(currentTrackId => ({ currentTrackId }))),
            this.queue$.pipe(map(queue => ({ queue }))),
            this.timePlayed$.pipe(map(timePlayed => ({ timePlayed }))),
            this.duration$.pipe(map(duration => ({ duration }))),
            this.trackName$.pipe(map(trackName => ({ trackName }))),
            this.albumName$.pipe(map(albumName => ({ albumName }))),
            this.artistName$.pipe(map(artistName => ({ artistName }))),
            this.volume$.pipe(map(volume => ({ volume }))),
            this.thumbnailUrl$.pipe(map(thumbnailUrl => ({ thumbnailUrl }))),
            this.isLiked$.pipe(map(isLiked => ({ isLiked }))),
            this.refreshPlaybackCommand$.pipe(map(refreshPlaybackCommand => ({ refreshPlaybackCommand }))),
            this.pauseCommand$.pipe(map(pauseCommand => ({ pauseCommand }))),
            this.prevCommand$.pipe(map(prevCommand => ({ prevCommand }))),
            this.nextCommand$.pipe(map(nextCommand => ({ nextCommand }))),
            this.volumeUpCommand$.pipe(map(volumeUpCommand => ({ volumeUpCommand }))),
            this.volumeDownCommand$.pipe(map(volumeDownCommand => ({ volumeDownCommand }))),
            this.refreshPlaybackCommand$.pipe(map(refreshPlaybackCommand => ({ refreshPlaybackCommand }))),
            this.likeSongCommand$.pipe(map(likeSongCommand => ({ likeSongCommand }))),
            this.unlikeSongCommand$.pipe(map(unlikeSongCommand => ({ unlikeSongCommand }))),
            this.seekPlaybackCommand$.pipe(map(seekPlaybackCommand => ({ seekPlaybackCommand }))),
            this.volumeCommand$.pipe(map(volumeCommand => ({ volumeCommand }))),
        ).pipe(
            takeUntil(this.dispose$)
        ).subscribe((v) => {
            //console.log(v);
            this.setState({
                ...this.state
            });
        });
    }

    componentWillUnmount() {
        this.dispose$.next();
        this.dispose$.complete();
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

