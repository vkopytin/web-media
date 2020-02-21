import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ICurrentlyPlayingResult, IPlayerResult } from '../service/adapter/spotify';
import { current, asyncQueue } from '../utils';
import { ServiceResult } from '../base/serviceResult';


const lockSection = asyncQueue();

class MediaPlayerViewModel extends Events {

    settings = {
        isPlaying: false,
        timePlayed: 1,
        duration: 3.14 * 60 * 1000,
        trackName: '',
        albumName: '',
        volume: 0,
        playbackInfo: {
            duration_ms: 1,
            progress_ms: 100,
            is_playing: false,
            trackName: '',
            albumName: '',
            timeLeft() { return ''; },
            timePlayed() { return ''; },
            duration() { return ''; }
        },
        errors: [] as ServiceResult<any, Error>[]
    };

    resumeCommand = {
        exec: _.bind(async function (this: MediaPlayerViewModel) {
            await this.ss.play();
            this.fetchData();
        }, this)
    };

    pauseCommand = {
        exec: _.bind(async function (this: MediaPlayerViewModel) {
            await this.ss.pause();
            this.fetchData();
        }, this)
    }

    prevCommand = {
        exec: _.bind(async function (this: MediaPlayerViewModel) {
            await this.ss.previous();
            this.fetchData();
        }, this)
    }

    nextCommand = {
        exec: _.bind(async function (this: MediaPlayerViewModel) {
            await this.ss.next();
            this.fetchData();
        }, this)
    }

    volumeUpCommand = {
        exec: () => {
            this.ss.playerVolumeUp();
        }
    }

    volumeCommand = {
        exec: (percent) => this.setVolume(percent)
    }

    volumeDownCommand = {
        exec: () => {
            this.ss.playerVolumeDown();
        }
    }

    refreshPlayback = {
        exec: () => {
            this.fetchData();
        }
    }

    seekPlaybackCommand = {
        exec: (percent) => this.manualSeek(percent)
    }

    trackArray = [] as Array<TrackViewModelItem>;
    monitorPlyback = _.debounce(this.monitorPlybackInternal, 500);
    autoSeek = _.debounce(this.autoSeekInternal, 500);

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
        
    }

    async fetchData() {
        const res = await this.ss.player();
        if (res.isError) {
            this.errors([res]);

            return res;
        }
        const currentlyPlaying = res.val as IPlayerResult;

        this.lastTime = +new Date();
        if (currentlyPlaying && currentlyPlaying.item) {
            this.volume(currentlyPlaying.device.volume_percent);
            this.duration(currentlyPlaying.item.duration_ms);
            this.timePlayed(currentlyPlaying.progress_ms);
            this.isPlaying(currentlyPlaying.is_playing);
            this.trackName(currentlyPlaying.item.name)
            this.albumName(currentlyPlaying.item.album.name)
            this.autoSeek();
        } else {
            this.isPlaying(currentlyPlaying?.is_playing || false);
        }
    }

    errors(val: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }

    monitorPlybackInternal() {
        _.delay(_.bind(async function (this: MediaPlayerViewModel) {
            if (!this.isPlaying()) {
                const res = await this.fetchData();
                if (res.isError) {
                    return;
                }
                this.monitorPlyback();
            }
        }, this), 5 * 1000);
    }

    lastTime = +new Date();
    autoSeekInternal() {
        if (this.isPlaying()) {
            const newTime = +new Date();
            const lastPlayed = this.timePlayed() + newTime - this.lastTime;
            if (this.duration() > lastPlayed) {
                this.timePlayed(lastPlayed);
            } else {
                this.fetchData();
            }
            this.lastTime = newTime;
            _.delay(() => this.autoSeek(), 800);
        } else {
            this.monitorPlyback();
        }
    }

    manualSeek(percent) {
        const max = this.duration(),
            timePlayed = max * percent / 100;
            
        lockSection.push(_.bind(async function (next) {
            this.timePlayed(timePlayed);
            await this.ss.seek(timePlayed);
            _.delay(() => {
                this.fetchData();
                next();
            }, 2000);
        }, this));
    }

    async setVolume(percent) {
        lockSection.push(_.bind(async function (next) {
            this.volume(percent);
            await this.ss.volume(percent);
            _.delay(() => {
                this.fetchData();
                next();
            }, 2000);
        }, this));
    }

    playbackInfo(val?) {
        if (arguments.length && this.settings.playbackInfo !== val) {
            this.settings.playbackInfo = val;
            this.trigger('change:playbackInfo');
        }

        return this.settings.playbackInfo;
    }

    queue(value?: any[]) {
        if (arguments.length && value !== this.trackArray) {
            this.trackArray = value;
            this.trigger('change:queue');
        }

        return this.trackArray;
    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.queue(), item);
    }

    async resume() {
        const playerResult= await this.ss.spotifyPlayer();
        playerResult.val.resume();
    }

    isPlaying(val?) {
        if (arguments.length && val !== this.settings.isPlaying) {
            this.settings.isPlaying = val;
            this.trigger('change:isPlaying');
        }

        return this.settings.isPlaying;
    }

    timePlayed(val?) {
        if (arguments.length && val !== this.settings.timePlayed) {
            this.settings.timePlayed = val;
            this.trigger('change:timePlayed');
        }

        return this.settings.timePlayed;
    }

    duration(val?) {
        if (arguments.length && val !== this.settings.duration) {
            this.settings.duration = val;
            this.trigger('change:duration');
        }

        return this.settings.duration;
    }

    trackName(val?) {
        if (arguments.length && val !== this.settings.trackName) {
            this.settings.trackName = val;
            this.trigger('change:trackName');
        }

        return this.settings.trackName;
    }

    albumName(val?) {
        if (arguments.length && val !== this.settings.albumName) {
            this.settings.albumName = val;
            this.trigger('change:albumName');
        }

        return this.settings.albumName;
    }

    volume(val?) {
        if (arguments.length && val !== this.settings.volume) {
            this.settings.volume = val;
            this.trigger('change:volume');
        }

        return this.settings.volume;
    }
}

export { MediaPlayerViewModel };
