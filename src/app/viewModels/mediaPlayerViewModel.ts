import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ICurrentlyPlayingResult, IPlayerResult } from '../service/adapter/spotify';
import { current, asyncQueue, assertNoErrors } from '../utils';
import { ServiceResult } from '../base/serviceResult';
import { IWebPlaybackState } from '../service/spotifyPlayer';


const lockSection = asyncQueue();

class MediaPlayerViewModel extends Events {

    settings = {
        isPlaying: false,
        timePlayed: 1,
        duration: 3.14 * 60 * 1000,
        trackName: '',
        albumName: '',
        volume: 0,
        thumbnailUrl: '',
        errors: [] as ServiceResult<any, Error>[]
    };

    resumeCommand = {
        exec: () => this.play()
    };

    pauseCommand = {
        exec: () => this.pause()
    }

    prevCommand = {
        exec: () => this.previous()
    }

    nextCommand = {
        exec: () => this.next()
    }

    volumeUpCommand = {
        exec: () => this.volumeUp()
    }

    volumeCommand = {
        exec: (percent) => this.setVolume(percent)
    }

    volumeDownCommand = {
        exec: () => this.volumeDown()
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
    fetchData = _.debounce(this.fetchDataInternal, 500);

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        _.delay(() => this.connect());
    }

    async connect() {
        const playerResult = await this.ss.spotifyPlayer();
        const spotifyResult = await this.ss.service(SpotifyService);
        if (spotifyResult.isError) {
            this.errors([spotifyResult]);
        }
        if (assertNoErrors(spotifyResult, playerResult, e => this.errors(e))) {
            return;
        }
        playerResult.val.on('playerStateChanged', (en, state) => this.updateFromPlayerState(state));
        spotifyResult.val.on('change:state', state => this.updateState(state));
        this.updateState();
    }

    async currentPlayerState() {
        const stateResult = await this.ss.spotifyPlayerState();
        if (assertNoErrors(stateResult, e => this.errors(e))) {
            return;
        }
        const state = stateResult.val as IWebPlaybackState;

        return state;
    }

    updateState(res?) {
        _.delay(() => this.fetchData(), 1000);
    }

    async updateFromPlayerState(state: IWebPlaybackState) {
        if (!state) {
            return;
        }
        this.duration(state.duration);
        this.timePlayed(state.position);
        this.isPlaying(!state.paused);
        this.trackName(state.track_window.current_track.name);
        this.albumName(state.track_window.current_track.album.name);
        this.thumbnailUrl(_.last(state.track_window.current_track.album.images).url);
        this.autoSeek();
        const playerResult = await this.ss.spotifyPlayer();
        if (assertNoErrors(playerResult, e => this.errors(e))) {
            return;
        }
        this.volume(playerResult.val.getVolume());
    }

    async fetchDataInternal() {
        const res = await this.ss.player();
        if (assertNoErrors(res, e => this.errors(e))) {
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
            this.thumbnailUrl(_.last(currentlyPlaying.item.album.images).url)
            this.autoSeek();
        } else {
            this.isPlaying(currentlyPlaying?.is_playing || false);
        }
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }

    monitorPlybackInternal() {
        _.delay(_.bind(async function (this: MediaPlayerViewModel) {
            if (!this.isPlaying()) {
                await this.fetchData();
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
                this.lastTime = newTime;
                this.autoSeek();
            } else {
                this.fetchData();
            }
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

            next();
        }, this));
    }

    async setVolume(percent) {
        lockSection.push(_.bind(async function (this: MediaPlayerViewModel, next) {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors(e))) {
                return;
            }
            if (_.isEmpty(stateResult.val)) {
                this.volume(percent);
                await this.ss.volume(percent);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors(e))) {
                    return;
                }
                this.volume(percent);
                playerResult.val.setVolume(percent);
            }

            next();
        }, this));
    }

    async play() {
        lockSection.push(_.bind(async function (this: MediaPlayerViewModel, next) {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors(e))) {
                return;
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.play();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors(e))) {
                    return;
                }
                playerResult.val.resume();
            }

            next();
        }, this));
    }

    async pause() {
        lockSection.push(_.bind(async function (this: MediaPlayerViewModel, next) {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors(e))) {
                return;
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.pause();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors(e))) {
                    return;
                }
                playerResult.val.pause();
            }

            next();
        }, this));
    }

    async previous() {
        lockSection.push(_.bind(async function (this: MediaPlayerViewModel, next) {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors(e))) {
                return;
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.previous();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors(e))) {
                    return;
                }
                playerResult.val.previouseTrack();
            }

            next();
        }, this));
    }

    async next() {
        lockSection.push(_.bind(async function (this: MediaPlayerViewModel, next) {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors(e))) {
                return;
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.next();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors(e))) {
                    return;
                }
                playerResult.val.nextTrack();
            }

            next();
        }, this));
    }

    async volumeUp() {
        lockSection.push(_.bind(async function (this: MediaPlayerViewModel, next) {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors(e))) {
                return;
            }
            if (_.isEmpty(stateResult.val)) {
                const volume = this.volume();
                await this.ss.volume(volume * 1.1);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors(e))) {
                    return;
                }
                const volume = await playerResult.val.getVolume() * 100;
                this.volume(volume * 1.1);
            }

            next();
        }, this));
    }

    async volumeDown() {
        lockSection.push(_.bind(async function (this: MediaPlayerViewModel, next) {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors(e))) {
                return;
            }
            if (_.isEmpty(stateResult.val)) {
                const volume = this.volume();
                await this.ss.volume(volume * 0.9);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors(e))) {
                    return;
                }
                const volume = await playerResult.val.getVolume() * 100;
                this.volume(volume * 0.9);
            }

            next();
        }, this));
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

    thumbnailUrl(val?) {
        if (arguments.length && val !== this.settings.thumbnailUrl) {
            this.settings.thumbnailUrl = val;
            this.trigger('change:thumbnailUrl');
        }

        return this.settings.thumbnailUrl;
    }
}

export { MediaPlayerViewModel };