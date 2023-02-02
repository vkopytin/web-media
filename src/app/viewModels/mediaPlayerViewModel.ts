import * as _ from 'underscore';
import { AppService, LogService } from '../service';
import { SettingsService } from '../service/settings';
import { MediaService } from '../service/mediaService';
import { PlaybackService } from '../service/playbackService';
import { asyncDebounce, asyncQueue, Binding, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';
import { RemotePlaybackService } from '../service/remotePlaybackService';
import { ITrack } from '../ports/iMediaProt';
import { IWebPlaybackState } from '../ports/iPlaybackPort';
import { Option, Some } from '../utils/option';

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
    currentTrackId!: string;

    monitorPlyback = asyncDebounce(() => this.monitorPlybackInternal(), 5 * 1000);
    autoSeek = asyncDebounce(() => this.autoSeekInternal(), 500);

    constructor(
        private logService: LogService,
        private appViewModel: AppViewModel,
        private media: MediaService,
        private settingsSerivce: SettingsService,
        private playback: PlaybackService,
        private remotePlaybackService: RemotePlaybackService,
        private app: AppService
    ) {

    }

    async init(): Promise<void> {
        try {
            await this.connect();
            await this.fetchData();
        } catch (ex) {
            this.errors = [Result.error(ex as Error)];
        }
    }

    async connect(): Promise<void> {
        this.playback.on('playerStateChanged', (en: unknown, state: IWebPlaybackState) => this.updateFromPlayerState(state));
        this.remotePlaybackService.on('change:state', () => this.fetchData());
    }

    async currentPlayerState(): Promise<Result<Error, IWebPlaybackState>> {
        const state = await this.playback.getCurrentState();
        return state;
    }

    async updateFromPlayerState(state: IWebPlaybackState): Promise<void> {
        if (!state) {
            return;
        }
        const [artist] = state.track_window.current_track?.artists || [];
        this.currentTrack = state.track_window.current_track as ITrack | null;
        this.currentTrackUri = state.track_window.current_track?.uri || '';
        if (this.currentTrackId !== this.currentTrack?.id) {
            this.currentTrackId = state.track_window.current_track?.id || '';
            this.checkTrackExists();
        }
        this.trackName = state.track_window.current_track?.name || '';
        this.albumName = state.track_window.current_track?.album.name || '';
        this.thumbnailUrl = _.first(state.track_window.current_track?.album?.images || [])?.url || '';
        this.duration = state.duration;
        this.timePlayed = state.position;
        this.isPlaying = !state.paused;
        this.artistName = artist?.name || '';
        this.autoSeek();

        const settingsResult = await this.settingsSerivce.get('spotify');
        await settingsResult.map(settings => settings?.volume || this.volume)
            .match(async volume => {
                const res = await this.playback.setVolume(volume);
                res.map(e => this.errors = [Result.error(e)]);

                return this.volume = volume;
            }, async () => {
                const volume = await this.playback.getVolume();
                volume.map(v => this.volume = v)
                    .error(e => (this.errors = [Result.error(e)], 0));

                return this.volume;
            });
    }

    async refreshPlayback() {
        const res = await this.fetchData();
        res.map(e => {
            throw e;
        });
    }

    async fetchData(): Promise<Option<Error>> {
        const res = await this.remotePlaybackService.player();
        return res.match(currentlyPlaying => {
            this.lastTime = +new Date();
            if (currentlyPlaying && currentlyPlaying.item) {
                const [artist] = currentlyPlaying.item.artists;
                this.currentTrack = currentlyPlaying.item;
                this.currentTrackUri = currentlyPlaying.item.uri;
                if (this.currentTrackId !== currentlyPlaying.item.id) {
                    this.currentTrackId = currentlyPlaying.item.id;
                    this.checkTrackExists();
                }
                this.duration = currentlyPlaying.item.duration_ms || 0;
                this.trackName = currentlyPlaying.item.name;
                this.albumName = currentlyPlaying.item.album.name;
                this.volume = currentlyPlaying.device.volume_percent;
                this.timePlayed = currentlyPlaying.progress_ms;
                this.isPlaying = currentlyPlaying.is_playing;
                this.artistName = artist.name;
                this.thumbnailUrl = _.first(currentlyPlaying.item.album.images)?.url || '';
                this.autoSeek();
            } else {
                this.isPlaying = currentlyPlaying?.is_playing || false;
            }

            return Option.none<Error>();
        }, e => {
            this.errors = [Result.error(e)];

            return Some.some(e);
        });
    }

    async checkTrackExists(): Promise<void> {
        if (!this.currentTrackId) {
            return;
        }
        const trackExistsResult = await this.media.hasTracks(this.currentTrackId);
        trackExistsResult.map(r => this.isLiked = _.first(r) || false)
            .error(e => this.errors = [Result.error(e)]);
    }

    monitorPlybackInternal(): void {
        if (!this.isPlaying) {
            (async () => {
                await this.fetchData();
                await this.monitorPlyback();
            })();
        }
    }

    lastTime = +new Date();
    async autoSeekInternal(): Promise<void> {
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

    manualSeek(percent: number): Promise<void> {
        const max = this.duration;
        const timePlayed = max * percent / 100;

        return new Promise(resolve => {
            lockSection.push(async (next) => {
                try {
                    this.timePlayed = timePlayed;
                    const res = await this.remotePlaybackService.seek(timePlayed);
                    res.error(() => this.errors = [res]);
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    setVolume(percent: number): Promise<void> {
        return new Promise(resolve => {
            lockSection.push(async next => {
                try {
                    const state = await this.playback.getCurrentState();
                    await state.map(async state => {
                        if (_.isEmpty(state) || _.isEmpty(state?.playback_id)) {
                            this.volume = percent;
                            const res = await this.remotePlaybackService.volume(percent);
                            res.error(e => this.errors = [Result.error(e)]);
                        } else {
                            this.volume = percent;
                            const res = await this.playback.setVolume(percent);
                            res.map(e => this.errors = [Result.error(e)]);
                        }

                        this.settingsSerivce.volume(this.volume = percent);
                    }).await();
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    play(): Promise<void> {
        return new Promise(resolve => {
            lockSection.push(async next => {
                try {
                    const state = await this.playback.getCurrentState();
                    await state.map(async state => {
                        if (_.isEmpty(state) || _.isEmpty(state?.playback_id)) {
                            const res = await this.remotePlaybackService.play();
                            res.map(() => this.isPlaying = true)
                                .error(e => this.errors = [Result.error(e)]);
                        } else {
                            const res = await this.playback.resume();
                            res.map(e => this.errors = [Result.error(e)]);
                            this.isPlaying = true;
                        }
                    }).await();
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    pause(): Promise<void> {
        return new Promise(resolve => {
            lockSection.push(async next => {
                try {
                    const state = await this.playback.getCurrentState();
                    await state.map(async state => {
                        if (_.isEmpty(state) || _.isEmpty(state?.playback_id)) {
                            const res = await this.remotePlaybackService.pause();
                            res.map(() => this.isPlaying = false)
                                .error(e => this.errors = [Result.error(e)]);
                        } else {
                            const res = await this.playback.pause();
                            res.map(e => this.errors = [Result.error(e)]);
                            this.isPlaying = false;
                        }
                    }).await();
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    previous(): Promise<void> {
        return new Promise(resolve => {
            lockSection.push(async next => {
                try {
                    const state = await this.playback.getCurrentState();
                    await state.map(async state => {
                        if (_.isEmpty(state) || _.isEmpty(state?.playback_id)) {
                            const res = await this.remotePlaybackService.previous();
                            res.error(() => this.errors = [res]);
                        } else {
                            const res = await this.playback.previouseTrack();
                            res.map(e => this.errors = [Result.error(e)])
                        }
                    }).await();
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    next(): Promise<void> {
        return new Promise(resolve => {
            lockSection.push(async next => {
                try {
                    const state = await this.playback.getCurrentState();
                    await state.map(async state => {
                        if (_.isEmpty(state) || _.isEmpty(state?.playback_id)) {
                            const res = await this.remotePlaybackService.next();
                            res.error(() => this.errors = [res]);
                        } else {
                            const res = await this.playback.nextTrack();
                            res.map(e => this.errors = [Result.error(e)]);
                        }
                    }).await();
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    volumeUp(): Promise<void> {
        return new Promise(resolve => {
            lockSection.push(async (next) => {
                try {
                    const state = await this.playback.getCurrentState();
                    await state.map(async state => {
                        if (_.isEmpty(state) || _.isEmpty(state?.playback_id)) {
                            const volume = this.volume;
                            const res = await this.remotePlaybackService.volume(volume * 1.1);
                            res.error(() => this.errors = [res]);
                        } else {
                            const volume = await this.playback.getVolume();
                            volume.map(v => this.volume = v * 1.1)
                                .error(e => this.errors = [Result.error(e)]);
                        }
                    }).await();
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    volumeDown(): Promise<void> {
        return new Promise(resolve => {
            lockSection.push(async next => {
                try {
                    const state = await this.playback.getCurrentState();
                    await state.map(async state => {
                        if (_.isEmpty(state) || _.isEmpty(state?.playback_id)) {
                            const volume = this.volume;
                            const res = await this.remotePlaybackService.volume(volume * 0.9);
                            res.error(e => this.errors = [Result.error(e)]);
                        } else {
                            const volume = await this.playback.getVolume();
                            volume.map(v => this.volume = v * 0.9)
                                .error(e => this.errors = [Result.error(e)]);
                        }
                    }).await();
                } catch (ex) {
                    this.errors = [Result.error(ex as Error)];
                }
                next();
                resolve();
            });
        });
    }

    likeTrack(): void {
        lockSection.push(async (next) => {
            try {
                if (!this.currentTrack) {
                    next();
                    return;
                }
                const stateResult = await this.app.addTracks(this.currentTrack);
                stateResult.error(() => this.errors = [stateResult]);
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    unlikeTrack(): void {
        lockSection.push(async (next) => {
            if (!this.currentTrack) {
                next();
                return;
            }
            try {
                const stateResult = await this.app.removeTracks(this.currentTrack);
                stateResult.error(e => this.errors = [Result.error(e)]);
            } catch (ex) {
                this.errors = [Result.error(ex as Error)];
            }
            next();
        });
    }

    playInTracks(item: TrackViewModelItem): Promise<void> {
        return item.playTracks(this.queue);
    }

    async resume(): Promise<void> {
        const res = await this.playback.resume();
        res.map(e => this.errors = [Result.error(e)]);
    }
}

export { MediaPlayerViewModel };
