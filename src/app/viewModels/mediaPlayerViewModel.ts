import * as _ from 'underscore';
import { ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { SpotifyService } from '../service/spotify';
import { IWebPlaybackState } from '../service/spotifyPlayer';
import { assertNoErrors, asyncQueue, current, State, ValueContainer } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';


const lockSection = asyncQueue();

class MediaPlayerViewModel {
    errors$: ValueContainer<ServiceResult<any, Error>[], MediaPlayerViewModel>;
    @State errors = [] as ServiceResult<any, Error>[];

    currentTrackId$ = this.appViewModel.currentTrackId$;
    @State currentTrackId = '';

    queue$: ValueContainer<MediaPlayerViewModel['queue'], MediaPlayerViewModel>;
    @State queue = [] as TrackViewModelItem[];

    timePlayed$: ValueContainer<MediaPlayerViewModel['timePlayed'], MediaPlayerViewModel>;
    @State timePlayed = 1;

    duration$: ValueContainer<MediaPlayerViewModel['duration'], MediaPlayerViewModel>;
    @State duration = 3.14 * 60 * 1000;

    isPlaying$: ValueContainer<MediaPlayerViewModel['isPlaying'], MediaPlayerViewModel>;
    @State isPlaying = false;

    trackName$: ValueContainer<MediaPlayerViewModel['trackName'], MediaPlayerViewModel>;
    @State trackName = '';

    albumName$: ValueContainer<MediaPlayerViewModel['albumName'], MediaPlayerViewModel>;
    @State albumName = '';

    artistName$: ValueContainer<MediaPlayerViewModel['artistName'], MediaPlayerViewModel>;
    @State artistName = '';

    volume$: ValueContainer<MediaPlayerViewModel['volume'], MediaPlayerViewModel>;
    @State volume = 50;

    thumbnailUrl$: ValueContainer<MediaPlayerViewModel['thumbnailUrl'], MediaPlayerViewModel>;
    @State thumbnailUrl = '';

    isLiked$: ValueContainer<MediaPlayerViewModel['isLiked'], MediaPlayerViewModel>;
    @State isLiked = false;

    currentTrack$: ValueContainer<MediaPlayerViewModel['currentTrack'], MediaPlayerViewModel>;
    @State currentTrack = null as ITrack;

    currentTrackUri$: ValueContainer<MediaPlayerViewModel['currentTrackUri'], MediaPlayerViewModel>;
    @State currentTrackUri = '';

    tracks$: ValueContainer<MediaPlayerViewModel['tracks'], MediaPlayerViewModel>;
    @State tracks = null as TrackViewModelItem[];

    resumeCommand$: ValueContainer<MediaPlayerViewModel['resumeCommand'], MediaPlayerViewModel>;
    @State resumeCommand = Scheduler.Command(() => this.play());
    pauseCommand$: ValueContainer<MediaPlayerViewModel['pauseCommand'], MediaPlayerViewModel>;
    @State pauseCommand = Scheduler.Command(() => this.pause());
    prevCommand$: ValueContainer<MediaPlayerViewModel['prevCommand'], MediaPlayerViewModel>;
    @State prevCommand = Scheduler.Command(() => this.previous());
    nextCommand$: ValueContainer<MediaPlayerViewModel['nextCommand'], MediaPlayerViewModel>;
    @State nextCommand = Scheduler.Command(() => this.next());
    volumeUpCommand$: ValueContainer<MediaPlayerViewModel['volumeUpCommand'], MediaPlayerViewModel>;
    @State volumeUpCommand = Scheduler.Command(() => this.volumeUp());
    volumeCommand$: ValueContainer<MediaPlayerViewModel['volumeCommand'], MediaPlayerViewModel>;
    @State volumeCommand = Scheduler.Command((percent) => this.setVolume(percent));
    volumeDownCommand$: ValueContainer<MediaPlayerViewModel['volumeDownCommand'], MediaPlayerViewModel>;
    @State volumeDownCommand = Scheduler.Command(() => this.volumeDown());
    refreshPlaybackCommand$: ValueContainer<MediaPlayerViewModel['refreshPlaybackCommand'], MediaPlayerViewModel>;
    @State refreshPlaybackCommand = Scheduler.Command(() => this.fetchData());
    likeSongCommand$: ValueContainer<MediaPlayerViewModel['likeSongCommand'], MediaPlayerViewModel>;
    @State likeSongCommand = Scheduler.Command(() => this.likeTrack());
    unlikeSongCommand$: ValueContainer<MediaPlayerViewModel['unlikeSongCommand'], MediaPlayerViewModel>;
    @State unlikeSongCommand = Scheduler.Command(() => this.unlikeTrack());
    seekPlaybackCommand$: ValueContainer<MediaPlayerViewModel['seekPlaybackCommand'], MediaPlayerViewModel>;
    @State seekPlaybackCommand = Scheduler.Command((percent) => this.manualSeek(percent));

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

    manualSeek(percent) {
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
