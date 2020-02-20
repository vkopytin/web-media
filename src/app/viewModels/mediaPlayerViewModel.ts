import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ICurrentlyPlayingResult } from '../service/adapter/spotify';
import { current } from '../utils';


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
        }
    };

    resumeCommand = {
        exec: () => {
            this.ss.playerResume();
        }
    };

    pauseCommand = {
        exec: () => {
            this.ss.playerPause();
        }
    }

    prevCommand = {
        exec: () => {
            this.ss.playerPreviouseTrack();
        }
    }

    nextCommand = {
        exec: () => {
            this.ss.playerNextTrack();
        }
    }

    volumeUpCommand = {
        exec: () => {
            this.ss.playerVolumeUp();
        }
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

    trackArray = [] as Array<TrackViewModelItem>;

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    async fetchData() {
        const res = await this.ss.currentlyPlaying();
        if (res.isError) {
            return;
        }
        const currentlyPlaying = res.val as ICurrentlyPlayingResult;

        this.lastTime = +new Date();
        if (currentlyPlaying && currentlyPlaying.item) {
            this.duration(currentlyPlaying.item.duration_ms);
            this.timePlayed(currentlyPlaying.progress_ms);
            this.isPlaying(currentlyPlaying.is_playing);
            this.trackName(currentlyPlaying.item.name)
            this.albumName(currentlyPlaying.item.album.name)
            this.autoSeek();
        } else {
            this.isPlaying(currentlyPlaying.is_playing || false);
        }
    }

    monitorPlyback() {
        if (!this.isPlaying()) {
            this.fetchData();
            _.delay(() => this.monitorPlyback(), 30 * 1000);
        }
    }

    lastTime = +new Date();
    autoSeek() {
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
