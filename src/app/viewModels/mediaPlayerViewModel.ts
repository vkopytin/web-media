import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IPlayerResult, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { SpotifyService } from '../service/spotify';
import { IWebPlaybackState } from '../service/spotifyPlayer';
import { assertNoErrors, asyncQueue, current, State } from '../utils';
import { TrackViewModelItem } from './trackViewModelItem';


const lockSection = asyncQueue();

class MediaPlayerViewModel {
    errors$: BehaviorSubject<ServiceResult<any, Error>[]>;
    @State errors = [] as ServiceResult<any, Error>[];

    currentTrackId$: BehaviorSubject<MediaPlayerViewModel['currentTrackId']>;
    @State currentTrackId = '';

    queue$: BehaviorSubject<MediaPlayerViewModel['queue']>;
    @State queue = [] as TrackViewModelItem[];

    timePlayed$: BehaviorSubject<MediaPlayerViewModel['timePlayed']>;
    @State timePlayed = 1;

    duration$: BehaviorSubject<MediaPlayerViewModel['duration']>;
    @State duration = 3.14 * 60 * 1000;

    isPlaying$: BehaviorSubject<MediaPlayerViewModel['isPlaying']>;
    @State isPlaying = false;

    trackName$: BehaviorSubject<MediaPlayerViewModel['trackName']>;
    @State trackName = '';

    albumName$: BehaviorSubject<MediaPlayerViewModel['albumName']>;
    @State albumName = '';

    artistName$: BehaviorSubject<MediaPlayerViewModel['artistName']>;
    @State artistName = '';

    volume$: BehaviorSubject<MediaPlayerViewModel['volume']>;
    @State volume = 50;

    thumbnailUrl$: BehaviorSubject<MediaPlayerViewModel['thumbnailUrl']>;
    @State thumbnailUrl = '';

    isLiked$: BehaviorSubject<MediaPlayerViewModel['isLiked']>;
    @State isLiked = false;

    currentTrack$: BehaviorSubject<MediaPlayerViewModel['currentTrack']>;
    @State currentTrack = null as ITrack;

    currentTrackUri$: BehaviorSubject<MediaPlayerViewModel['currentTrackUri']>;
    @State currentTrackUri = '';

    tracks$: BehaviorSubject<MediaPlayerViewModel['tracks']>;
    @State tracks = null as TrackViewModelItem[];

    resumeCommand$: BehaviorSubject<MediaPlayerViewModel['resumeCommand']>;
    @State resumeCommand = { exec: () => this.play() };
    pauseCommand$: BehaviorSubject<MediaPlayerViewModel['pauseCommand']>;
    @State pauseCommand = { exec: () => this.pause() };
    prevCommand$: BehaviorSubject<MediaPlayerViewModel['prevCommand']>;
    @State prevCommand = { exec: () => this.previous() };
    nextCommand$: BehaviorSubject<MediaPlayerViewModel['nextCommand']>;
    @State nextCommand = { exec: () => this.next() };
    volumeUpCommand$: BehaviorSubject<MediaPlayerViewModel['volumeUpCommand']>;
    @State volumeUpCommand = { exec: () => this.volumeUp() };
    volumeCommand$: BehaviorSubject<MediaPlayerViewModel['volumeCommand']>;
    @State volumeCommand = { exec: (percent) => this.setVolume(percent) };
    volumeDownCommand$: BehaviorSubject<MediaPlayerViewModel['volumeDownCommand']>;
    @State volumeDownCommand = { exec: () => this.volumeDown() };
    refreshPlaybackCommand$: BehaviorSubject<MediaPlayerViewModel['refreshPlaybackCommand']>;
    @State refreshPlaybackCommand = { exec: () => this.fetchData() };
    likeSongCommand$: BehaviorSubject<MediaPlayerViewModel['likeSongCommand']>;
    @State likeSongCommand = { exec: () => this.likeTrack() };
    unlikeSongCommand$: BehaviorSubject<MediaPlayerViewModel['unlikeSongCommand']>;
    @State unlikeSongCommand = { exec: () => this.unlikeTrack() };
    seekPlaybackCommand$: BehaviorSubject<MediaPlayerViewModel['seekPlaybackCommand']>;
    @State seekPlaybackCommand = { exec: (percent) => this.manualSeek(percent) };

    monitorPlyback = _.debounce(this.monitorPlybackInternal, 5 * 1000);
    autoSeek = _.debounce(this.autoSeekInternal, 500);
    fetchData = _.debounce(this.fetchDataInternal, 500);

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        _.delay(() => {
            this.connect();
        });
    }

    async connect() {
        const playerResult = await this.ss.spotifyPlayer();
        const spotifyResult = await this.ss.service(SpotifyService);
        if (spotifyResult.isError) {
            this.errors = [spotifyResult];
        }
        if (assertNoErrors(spotifyResult, playerResult, e => this.errors = e)) {
            return;
        }
        playerResult.val.on('playerStateChanged', (en, state) => this.updateFromPlayerState(state));
        spotifyResult.val.on('change:state', state => this.updateState(state));
        this.updateState();
    }

    async currentPlayerState() {
        const stateResult = await this.ss.spotifyPlayerState();
        if (assertNoErrors(stateResult, e => this.errors = e)) {
            return;
        }
        const state = stateResult.val as IWebPlaybackState;

        return state;
    }

    updateState(res?) {
        this.fetchData();
    }

    async updateFromPlayerState(state: IWebPlaybackState) {
        if (!state) {
            return;
        }
        const [artist] = state.track_window.current_track.artists;
        this.currentTrack = state.track_window.current_track as any;
        this.currentTrackUri = state.track_window.current_track.uri;
        this.currentTrackId = state.track_window.current_track.id;
        this.duration = state.duration;
        this.timePlayed = state.position;
        this.isPlaying = !state.paused;
        this.trackName = state.track_window.current_track.name;
        this.albumName = state.track_window.current_track.album.name;
        this.artistName = artist.name;
        this.thumbnailUrl = _.last(state.track_window.current_track.album.images).url;
        this.autoSeek();
        this.checkTrackExists();
        const playerResult = await this.ss.spotifyPlayer();
        if (assertNoErrors(playerResult, e => this.errors = e)) {
            return;
        }
        const settingsResult = await this.ss.settings('spotify');
        if (settingsResult.isError) {
            const volume = await playerResult.val.getVolume();
            return this.volume = volume;
        }
        playerResult.val.setVolume(settingsResult.val.volume);
        this.volume = settingsResult.val.volume;
    }

    async fetchDataInternal() {
        const res = await this.ss.player();
        if (assertNoErrors(res, e => this.errors = e)) {
            return res;
        }
        const currentlyPlaying = res.val as IPlayerResult;

        this.lastTime = +new Date();
        if (currentlyPlaying && currentlyPlaying.item) {
            const [artist] = currentlyPlaying.item.artists;
            this.currentTrack = currentlyPlaying.item;
            this.currentTrackUri = currentlyPlaying.item.uri;
            this.currentTrackId = currentlyPlaying.item.id;
            this.volume = currentlyPlaying.device.volume_percent;
            this.duration = currentlyPlaying.item.duration_ms;
            this.timePlayed = currentlyPlaying.progress_ms;
            this.isPlaying = currentlyPlaying.is_playing;
            this.trackName = currentlyPlaying.item.name;
            this.albumName = currentlyPlaying.item.album.name;
            this.artistName = artist.name;
            this.thumbnailUrl = _.last(currentlyPlaying.item.album.images).url;
            this.autoSeek();
            this.checkTrackExists();
        } else {
            this.isPlaying = currentlyPlaying?.is_playing || false;
        }
    }

    async checkTrackExists() {
        const trackExistsResult = await this.ss.hasTracks(this.currentTrackId);
        if (assertNoErrors(trackExistsResult, e => this.errors = e)) {
            return;
        }
        const likedResult = trackExistsResult.val as boolean[];
        this.isLiked = _.first(likedResult);
    }

    async monitorPlybackInternal() {
        if (!this.isPlaying) {
            await this.fetchData();
            this.monitorPlyback();
        }
    }

    lastTime = +new Date();
    autoSeekInternal() {
        if (this.isPlaying) {
            const newTime = +new Date();
            const lastPlayed = this.timePlayed + newTime - this.lastTime;
            if (this.duration > lastPlayed) {
                this.timePlayed = lastPlayed;
                this.lastTime = newTime;
                _.delay(() => this.autoSeek());
            } else {
                this.fetchData();
            }
        } else {
            this.monitorPlyback();
        }
    }

    manualSeek(percent) {
        const max = this.duration,
            timePlayed = max * percent / 100;
            
        lockSection.push(async (next) => {
            this.timePlayed = timePlayed;
            await this.ss.seek(timePlayed);

            next();
        });
    }

    async setVolume(percent: number) {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                this.volume = percent;
                await this.ss.volume(percent);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors = e)) {
                    return next();
                }
                this.volume = percent;
                await playerResult.val.setVolume(percent);
            }
            const settingsResult = await this.ss.service(SettingsService);
            if (assertNoErrors(settingsResult, e => this.errors = e)) {
                return next();
            }
            this.volume = settingsResult.val.volume(percent);

            next();
        });
    }

    async play() {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                const playResult = await this.ss.play();
                if (assertNoErrors(playResult, e => this.errors = e)) {
                    return next();
                }
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors = e)) {
                    return next();
                }
                await playerResult.val.resume();
            }
            this.isPlaying = true;

            next();
        });
    }

    async pause() {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.pause();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors = e)) {
                    return next();
                }
                await playerResult.val.pause();
            }
            this.isPlaying = false;

            next();
        });
    }

    async previous() {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.previous();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors = e)) {
                    return next();
                }
                await playerResult.val.previouseTrack();
            }

            next();
        });
    }

    async next() {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.next();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors = e)) {
                    return next();
                }
                await playerResult.val.nextTrack();
            }

            next();
        });
    }

    async volumeUp() {
        lockSection.push(async (next) => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                const volume = this.volume;
                await this.ss.volume(volume * 1.1);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors = e)) {
                    return next();
                }
                const volume = await playerResult.val.getVolume();
                this.volume = volume * 1.1;
            }

            next();
        });
    }

    async volumeDown() {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, e => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                const volume = this.volume;
                await this.ss.volume(volume * 0.9);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, e => this.errors = e)) {
                    return next();
                }
                const volume = await playerResult.val.getVolume();
                this.volume = volume * 0.9;
            }

            next();
        });
    }

    async likeTrack() {
        lockSection.push(async (next) => {
            const stateResult = await this.ss.addTracks(this.currentTrack);
            assertNoErrors(stateResult, e => this.errors = e);

            next();
        });
    }

    async unlikeTrack() {
        lockSection.push(async (next) => {
            const stateResult = await this.ss.removeTracks(this.currentTrack);
            assertNoErrors(stateResult, e => this.errors = e);

            next();
        });
    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.queue);
    }

    async resume() {
        const playerResult= await this.ss.spotifyPlayer();
        playerResult.val.resume();
    }
}

export { MediaPlayerViewModel };
