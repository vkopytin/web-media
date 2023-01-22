import * as _ from 'underscore';
import { ITrack } from '../adapter/spotify';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { SpotifyService } from '../service/spotify';
import { IWebPlaybackState, SpotifyPlayerService } from '../service/spotifyPlayer';
import { asyncDebounce, asyncQueue, Binding, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';

const lockSection = asyncQueue();

class MediaPlayerViewModel {
    @State errors: Result[] = [];
    @State queue: TrackViewModelItem[] = [];
    @State timePlayed = 1;
    @State duration = 3.14 * 60 * 1000;
    @State isPlaying = false;
    @State trackName = '';
    @State albumName = '';
    @State artistName = '';
    @State volume = 50;
    @State thumbnailUrl = '';
    @State isLiked = false;
    @State currentTrack: ITrack | null = null;
    @State currentTrackUri = '';
    @State tracks: TrackViewModelItem[] | null = null;

    @State resumeCommand = Scheduler.Command(() => this.play());
    @State pauseCommand = Scheduler.Command(() => this.pause());
    @State prevCommand = Scheduler.Command(() => this.previous());
    @State nextCommand = Scheduler.Command(() => this.next());
    @State volumeUpCommand = Scheduler.Command(() => this.volumeUp());
    @State volumeCommand = Scheduler.Command((percent: number) => this.setVolume(percent));
    @State volumeDownCommand = Scheduler.Command(() => this.volumeDown());
    @State refreshPlaybackCommand = Scheduler.Command(() => this.fetchData());
    @State likeSongCommand = Scheduler.Command(() => this.likeTrack());
    @State unlikeSongCommand = Scheduler.Command(() => this.unlikeTrack());
    @State seekPlaybackCommand = Scheduler.Command((percent: number) => this.manualSeek(percent));

    @Binding((vm: MediaPlayerViewModel) => vm.appViewModel, 'currentTrackId')
    currentTrackId = '';

    monitorPlyback = asyncDebounce(() => this.monitorPlybackInternal(), 5 * 1000);
    autoSeek = asyncDebounce(() => this.autoSeekInternal(), 500);
    fetchData = asyncDebounce(() => this.fetchDataInternal(), 500);

    constructor(
        private appViewModel: AppViewModel,
        private spotifyService: SpotifyService,
        private settingsSerivce: SettingsService,
        private spotifyPlayerService: SpotifyPlayerService,
        private ss: Service
    ) {

    }

    async init() {
        try {
            await this.connect();
            await this.fetchData();
        } catch (ex) {
            this.errors = [Result.error(ex as Error)];
        }
    }

    async connect() {
        this.spotifyPlayerService.on('playerStateChanged', (en: unknown, state: IWebPlaybackState) => this.updateFromPlayerState(state));
        this.spotifyService.on('change:state', (state: IWebPlaybackState) => this.fetchData());

        await this.fetchData();
    }

    async currentPlayerState() {
        const state = await this.spotifyPlayerService.getCurrentState();
        return state;
    }

    async updateFromPlayerState(state: IWebPlaybackState) {
        if (!state) {
            return;
        }
        const [artist] = state.track_window.current_track?.artists || [];
        this.currentTrack = state.track_window.current_track as any;
        this.currentTrackUri = state.track_window.current_track?.uri || '';
        this.currentTrackId = state.track_window.current_track?.id || '';
        this.trackName = state.track_window.current_track?.name || '';
        this.albumName = state.track_window.current_track?.album.name || '';
        this.thumbnailUrl = _.first(state.track_window.current_track?.album?.images || [])?.url || '';
        this.duration = state.duration;
        this.timePlayed = state.position;
        this.isPlaying = !state.paused;
        this.artistName = artist?.name || '';
        this.autoSeek();
        this.checkTrackExists();

        const settingsResult = await this.settingsSerivce.get('spotify');
        await settingsResult.map(settings => settings?.volume || this.volume)
            .match(async volume => {
                const res = await this.spotifyPlayerService.setVolume(volume);
                res.map(e => this.errors = [Result.error(e)]);

                return this.volume = volume;
            }, async () => {
                const volume = await this.spotifyPlayerService.getVolume();
                volume.map(v => this.volume = v)
                    .error(e => (this.errors = [Result.error(e)], 0));

                return this.volume;
            });
    }

    async fetchDataInternal() {
        const res = await this.spotifyService.player();
        res.map(currentlyPlaying => {
            this.lastTime = +new Date();
            if (currentlyPlaying && currentlyPlaying.item) {
                const [artist] = currentlyPlaying.item.artists;
                this.currentTrack = currentlyPlaying.item;
                this.currentTrackUri = currentlyPlaying.item.uri;
                this.currentTrackId = currentlyPlaying.item.id;
                this.duration = currentlyPlaying.item.duration_ms || 0;
                this.trackName = currentlyPlaying.item.name;
                this.albumName = currentlyPlaying.item.album.name;
                this.volume = currentlyPlaying.device.volume_percent;
                this.timePlayed = currentlyPlaying.progress_ms;
                this.isPlaying = currentlyPlaying.is_playing;
                this.artistName = artist.name;
                this.thumbnailUrl = _.first(currentlyPlaying.item.album.images)?.url || '';
                this.autoSeek();
                this.checkTrackExists();
            } else {
                this.isPlaying = currentlyPlaying?.is_playing || false;
            }
        }).error(e => {
            this.errors = [Result.error(e)];
            throw e;
        });
    }

    async checkTrackExists() {
        if (!this.currentTrackId) {
            return;
        }
        const trackExistsResult = await this.ss.hasTracks(this.currentTrackId);
        trackExistsResult.map(r => this.isLiked = _.first(r) || false)
            .error(e => this.errors = [Result.error(e)]);
    }

    async monitorPlybackInternal() {
        if (!this.isPlaying) {
            await this.fetchData();
            await this.monitorPlyback();
        }
    }

    lastTime = +new Date();
    async autoSeekInternal() {
        try {
            if (!this.isPlaying) {
                await this.monitorPlyback();
                return;
            }

            const newTime = +new Date();
            const lastPlayed = this.timePlayed + newTime - this.lastTime;
            if (this.duration < lastPlayed) {
                this.refreshPlaybackCommand.exec();
                return;
            }

            this.timePlayed = lastPlayed;
            this.lastTime = newTime;
            this.autoSeek();
        } catch (ex) {
            this.errors = [Result.error(ex as Error)];
        }
    }

    manualSeek(percent: number) {
        const max = this.duration;
        const timePlayed = max * percent / 100;

        lockSection.push(async (next) => {
            try {
                this.timePlayed = timePlayed;
                const res = await this.ss.seek(timePlayed);
                res.error(() => this.errors = [res]);
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async setVolume(percent: number) {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                await state.map(async state => {
                    if (_.isEmpty(state)) {
                        this.volume = percent;
                        const res = await this.ss.volume(percent);
                        res.error(e => this.errors = [Result.error(e)]);
                    } else {
                        this.volume = percent;
                        const res = await this.spotifyPlayerService.setVolume(percent);
                        res.map(e => this.errors = [Result.error(e)]);
                    }

                    this.settingsSerivce.volume(this.volume = percent);
                }).await();
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async play() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                await state.map(async state => {
                    if (_.isEmpty(state)) {
                        const res = await this.ss.play();
                        res.map(() => this.isPlaying = true)
                            .error(e => this.errors = [Result.error(e)]);
                    } else {
                        const res = await this.spotifyPlayerService.resume();
                        res.map(e => this.errors = [Result.error(e)]);
                        this.isPlaying = true;
                    }
                }).await();
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async pause() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                await state.map(async state => {
                    if (_.isEmpty(state)) {
                        const res = await this.ss.pause();
                        res.map(() => this.isPlaying = false)
                            .error(e => this.errors = [Result.error(e)]);
                    } else {
                        const res = await this.spotifyPlayerService.pause();
                        res.map(e => this.errors = [Result.error(e)]);
                        this.isPlaying = false;
                    }
                }).await();
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async previous() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                await state.map(async state => {
                    if (_.isEmpty(state)) {
                        const res = await this.ss.previous();
                        res.error(() => this.errors = [res]);
                    } else {
                        const res = await this.spotifyPlayerService.previouseTrack();
                        res.map(e => this.errors = [Result.error(e)])
                    }
                }).await();
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async next() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                await state.map(async state => {
                    if (_.isEmpty(state)) {
                        const res = await this.ss.next();
                        res.error(() => this.errors = [res]);
                    } else {
                        const res = await this.spotifyPlayerService.nextTrack();
                        res.map(e => this.errors = [Result.error(e)]);
                    }
                }).await();
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async volumeUp() {
        lockSection.push(async (next) => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                await state.map(async state => {
                    if (_.isEmpty(state)) {
                        const volume = this.volume;
                        const res = await this.ss.volume(volume * 1.1);
                        res.error(() => this.errors = [res]);
                    } else {
                        const volume = await this.spotifyPlayerService.getVolume();
                        volume.map(v => this.volume = v * 1.1)
                            .error(e => this.errors = [Result.error(e)]);
                    }
                }).await();
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async volumeDown() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                await state.map(async state => {
                    if (_.isEmpty(state)) {
                        const volume = this.volume;
                        const res = await this.ss.volume(volume * 0.9);
                        res.error(e => this.errors = [res]);
                    } else {
                        const volume = await this.spotifyPlayerService.getVolume();
                        volume.map(v => this.volume = v * 0.9)
                            .error(e => this.errors = [Result.error(e)]);
                    }
                }).await();
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async likeTrack() {
        lockSection.push(async (next) => {
            try {
                if (!this.currentTrack) {
                    next();
                    return;
                }
                const stateResult = await this.ss.addTracks(this.currentTrack);
                stateResult.error(() => this.errors = [stateResult]);
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    async unlikeTrack() {
        lockSection.push(async (next) => {
            if (!this.currentTrack) {
                next();
                return;
            }
            try {
                const stateResult = await this.ss.removeTracks(this.currentTrack);
                stateResult.error(e => this.errors = [stateResult]);
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.queue);
    }

    async resume() {
        const res = await this.spotifyPlayerService.resume();
        res.map(e => this.errors = [Result.error(e)]);
    }
}

export { MediaPlayerViewModel };
