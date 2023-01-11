import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { SpotifyService } from '../service/spotify';
import { IWebPlaybackState } from '../service/spotifyPlayer';
import { assertNoErrors, asyncQueue, Binding, current, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';


const lockSection = asyncQueue();

class MediaPlayerViewModel {
    errors$: BehaviorSubject<ServiceResult<any, Error>[]>;
    @State errors = [] as ServiceResult<any, Error>[];

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
    @State resumeCommand = Scheduler.Command(() => this.play());
    pauseCommand$: BehaviorSubject<MediaPlayerViewModel['pauseCommand']>;
    @State pauseCommand = Scheduler.Command(() => this.pause());
    prevCommand$: BehaviorSubject<MediaPlayerViewModel['prevCommand']>;
    @State prevCommand = Scheduler.Command(() => this.previous());
    nextCommand$: BehaviorSubject<MediaPlayerViewModel['nextCommand']>;
    @State nextCommand = Scheduler.Command(() => this.next());
    volumeUpCommand$: BehaviorSubject<MediaPlayerViewModel['volumeUpCommand']>;
    @State volumeUpCommand = Scheduler.Command(() => this.volumeUp());
    volumeCommand$: BehaviorSubject<MediaPlayerViewModel['volumeCommand']>;
    @State volumeCommand = Scheduler.Command((percent: number) => this.setVolume(percent));
    volumeDownCommand$: BehaviorSubject<MediaPlayerViewModel['volumeDownCommand']>;
    @State volumeDownCommand = Scheduler.Command(() => this.volumeDown());
    refreshPlaybackCommand$: BehaviorSubject<MediaPlayerViewModel['refreshPlaybackCommand']>;
    @State refreshPlaybackCommand = Scheduler.Command(() => this.fetchData());
    likeSongCommand$: BehaviorSubject<MediaPlayerViewModel['likeSongCommand']>;
    @State likeSongCommand = Scheduler.Command(() => this.likeTrack());
    unlikeSongCommand$: BehaviorSubject<MediaPlayerViewModel['unlikeSongCommand']>;
    @State unlikeSongCommand = Scheduler.Command(() => this.unlikeTrack());
    seekPlaybackCommand$: BehaviorSubject<MediaPlayerViewModel['seekPlaybackCommand']>;
    @State seekPlaybackCommand = Scheduler.Command((percent: number) => this.manualSeek(percent));

    currentTrackId$ = this.appViewModel.currentTrackId$;
    @Binding() currentTrackId = '';

    monitorPlyback = _.debounce(this.monitorPlybackInternal, 5 * 1000);
    autoSeek = _.debounce(this.autoSeekInternal, 500);
    fetchData = _.debounce(this.fetchDataInternal, 500);

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        await this.fetchData();
        resolve(true);
    }));

    constructor(private appViewModel = current(AppViewModel), private ss = current(Service)) {

    }

    async connect() {
        const playerResult = await this.ss.spotifyPlayer();
        const spotifyResult = await playerResult.cata((player) => {
            player.on('playerStateChanged', (en, state) => this.updateFromPlayerState(state));
            return this.ss.service(SpotifyService);
        });

        spotifyResult.assert(e => this.errors = [e])
            .cata(spotify => {
                spotify.on('change:state', state => this.updateState(state));
                this.updateState();
            });
    }

    async currentPlayerState() {
        const stateResult = await this.ss.spotifyPlayerState();

        return stateResult.assert(e => this.errors = [e]).cata(r => r);
    }

    updateState(res?: unknown) {
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
        this.thumbnailUrl = _.first(state.track_window.current_track.album.images).url;
        this.autoSeek();
        this.checkTrackExists();

        const playerResult = await this.ss.spotifyPlayer();
        await playerResult.assert(e => this.errors = [e]).cata(async player => {
            const settingsResult = await this.ss.settings('spotify');
            await settingsResult.assert(async () => {
                const volume = await player.getVolume();
                return this.volume = volume;
            }).cata(settings => {
                player.setVolume(settings.volume);
                this.volume = settings.volume;
            });
        });
    }

    async fetchDataInternal() {
        const res = await this.ss.player();
        res.map(currentlyPlaying => {
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
                this.thumbnailUrl = _.first(currentlyPlaying.item.album.images).url;
                this.autoSeek();
                this.checkTrackExists();
            } else {
                this.isPlaying = currentlyPlaying?.is_playing || false;
            }
        }).assert(e => this.errors = [e]);
    }

    async checkTrackExists() {
        const trackExistsResult = await this.ss.hasTracks(this.currentTrackId);
        trackExistsResult.assert(e => this.errors = [e])
            .cata(r => this.isLiked = _.first(r));
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

    manualSeek(percent: number) {
        const max = this.duration,
            timePlayed = max * percent / 100;

        lockSection.push(async (next) => {
            this.timePlayed = timePlayed;
            const res = await this.ss.seek(timePlayed);
            res.assert(e => this.errors = [e]);

            next();
        });
    }

    async setVolume(percent: number) {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            const res = await stateResult.assert(e => this.errors = [e]).cata(async state => {
                if (_.isEmpty(state)) {
                    this.volume = percent;
                    await this.ss.volume(percent);
                } else {
                    const playerResult = await this.ss.spotifyPlayer();
                    await playerResult.assert(e => this.errors = [e]).cata(async player => {
                        this.volume = percent;
                        await player.setVolume(percent);
                    });
                }

                return await this.ss.service(SettingsService);
            });
            res.assert(e => this.errors = [e]).cata(settings => {
                settings.volume(this.volume = percent);
            });

            next();
        });
    }

    async play() {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            const res = await stateResult.cata(async state => {
                if (_.isEmpty(state)) {
                    return await this.ss.play();
                } else {
                    const playerResult = await this.ss.spotifyPlayer();
                    await playerResult.val.resume();
                    return playerResult;
                }
            });
            res.assert(e => this.errors = [e]).cata(() => {
                this.isPlaying = true;
            });

            next();
        });
    }

    async pause() {
        lockSection.push(async next => {
            const stateResult = await this.ss.spotifyPlayerState();
            if (assertNoErrors(stateResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.pause();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
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
            if (assertNoErrors(stateResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.previous();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
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
            if (assertNoErrors(stateResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                await this.ss.next();
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
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
            if (assertNoErrors(stateResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                const volume = this.volume;
                await this.ss.volume(volume * 1.1);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
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
            if (assertNoErrors(stateResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
                return next();
            }
            if (_.isEmpty(stateResult.val)) {
                const volume = this.volume;
                await this.ss.volume(volume * 0.9);
            } else {
                const playerResult = await this.ss.spotifyPlayer();
                if (assertNoErrors(playerResult, (e: ServiceResult<unknown, Error>[]) => this.errors = e)) {
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
            stateResult.assert(e => this.errors = [e]);

            next();
        });
    }

    async unlikeTrack() {
        lockSection.push(async (next) => {
            const stateResult = await this.ss.removeTracks(this.currentTrack);
            stateResult.assert(e => this.errors = [e]);

            next();
        });
    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.queue);
    }

    async resume() {
        const playerResult = await this.ss.spotifyPlayer();
        playerResult.assert(e => this.errors = [e]).cata(player => player.resume());
    }
}

export { MediaPlayerViewModel };
