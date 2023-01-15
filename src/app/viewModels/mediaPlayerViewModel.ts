import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SettingsService } from '../service/settings';
import { SpotifyService } from '../service/spotify';
import { IWebPlaybackState, SpotifyPlayerService } from '../service/spotifyPlayer';
import { assertNoErrors, asyncQueue, Binding, current, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { TrackViewModelItem } from './trackViewModelItem';


const lockSection = asyncQueue();

class MediaPlayerViewModel {
    errors$!: BehaviorSubject<ServiceResult<any, Error>[]>;
    @State errors = [] as ServiceResult<any, Error>[];

    queue$!: BehaviorSubject<MediaPlayerViewModel['queue']>;
    @State queue = [] as TrackViewModelItem[];

    timePlayed$!: BehaviorSubject<MediaPlayerViewModel['timePlayed']>;
    @State timePlayed = 1;

    duration$!: BehaviorSubject<MediaPlayerViewModel['duration']>;
    @State duration = 3.14 * 60 * 1000;

    isPlaying$!: BehaviorSubject<MediaPlayerViewModel['isPlaying']>;
    @State isPlaying = false;

    trackName$!: BehaviorSubject<MediaPlayerViewModel['trackName']>;
    @State trackName = '';

    albumName$!: BehaviorSubject<MediaPlayerViewModel['albumName']>;
    @State albumName = '';

    artistName$!: BehaviorSubject<MediaPlayerViewModel['artistName']>;
    @State artistName = '';

    volume$!: BehaviorSubject<MediaPlayerViewModel['volume']>;
    @State volume = 50;

    thumbnailUrl$!: BehaviorSubject<MediaPlayerViewModel['thumbnailUrl']>;
    @State thumbnailUrl = '';

    isLiked$!: BehaviorSubject<MediaPlayerViewModel['isLiked']>;
    @State isLiked = false;

    currentTrack$!: BehaviorSubject<MediaPlayerViewModel['currentTrack']>;
    @State currentTrack: ITrack | null = null;

    currentTrackUri$!: BehaviorSubject<MediaPlayerViewModel['currentTrackUri']>;
    @State currentTrackUri = '';

    tracks$!: BehaviorSubject<MediaPlayerViewModel['tracks']>;
    @State tracks: TrackViewModelItem[] | null = null;

    resumeCommand$!: BehaviorSubject<MediaPlayerViewModel['resumeCommand']>;
    @State resumeCommand = Scheduler.Command(() => this.play());
    pauseCommand$!: BehaviorSubject<MediaPlayerViewModel['pauseCommand']>;
    @State pauseCommand = Scheduler.Command(() => this.pause());
    prevCommand$!: BehaviorSubject<MediaPlayerViewModel['prevCommand']>;
    @State prevCommand = Scheduler.Command(() => this.previous());
    nextCommand$!: BehaviorSubject<MediaPlayerViewModel['nextCommand']>;
    @State nextCommand = Scheduler.Command(() => this.next());
    volumeUpCommand$!: BehaviorSubject<MediaPlayerViewModel['volumeUpCommand']>;
    @State volumeUpCommand = Scheduler.Command(() => this.volumeUp());
    volumeCommand$!: BehaviorSubject<MediaPlayerViewModel['volumeCommand']>;
    @State volumeCommand = Scheduler.Command((percent: number) => this.setVolume(percent));
    volumeDownCommand$!: BehaviorSubject<MediaPlayerViewModel['volumeDownCommand']>;
    @State volumeDownCommand = Scheduler.Command(() => this.volumeDown());
    refreshPlaybackCommand$!: BehaviorSubject<MediaPlayerViewModel['refreshPlaybackCommand']>;
    @State refreshPlaybackCommand = Scheduler.Command(() => this.fetchData());
    likeSongCommand$!: BehaviorSubject<MediaPlayerViewModel['likeSongCommand']>;
    @State likeSongCommand = Scheduler.Command(() => this.likeTrack());
    unlikeSongCommand$!: BehaviorSubject<MediaPlayerViewModel['unlikeSongCommand']>;
    @State unlikeSongCommand = Scheduler.Command(() => this.unlikeTrack());
    seekPlaybackCommand$!: BehaviorSubject<MediaPlayerViewModel['seekPlaybackCommand']>;
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

    constructor(
        private appViewModel: AppViewModel,
        private spotifyService: SpotifyService,
        private settingsSerivce: SettingsService,
        private spotifyPlayerService: SpotifyPlayerService,
        private ss: Service
    ) {

    }

    async connect() {
        await this.spotifyPlayerService.on('playerStateChanged', (en, state) => this.updateFromPlayerState(state));

        this.spotifyService.on('change:state', state => this.fetchData());
        this.fetchData();
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
        await settingsResult.assert(async () => {
            const volume = await this.spotifyPlayerService.getVolume();
            return this.volume = volume;
        }).map(settings => settings?.volume || this.volume).cata(volume => {
            this.spotifyPlayerService.setVolume(volume);
            this.volume = volume;
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
                this.volume = currentlyPlaying.device.volume_percent;
                this.duration = currentlyPlaying.item.duration_ms || 0;
                this.timePlayed = currentlyPlaying.progress_ms;
                this.isPlaying = currentlyPlaying.is_playing;
                this.trackName = currentlyPlaying.item.name;
                this.albumName = currentlyPlaying.item.album.name;
                this.artistName = artist.name;
                this.thumbnailUrl = _.first(currentlyPlaying.item.album.images)?.url || '';
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
            .cata(r => this.isLiked = _.first(r) || false);
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
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                if (_.isEmpty(state)) {
                    this.volume = percent;
                    await this.ss.volume(percent);
                } else {
                    this.volume = percent;
                    await this.spotifyPlayerService.setVolume(percent);
                }

                this.settingsSerivce.volume(this.volume = percent);
            } finally {
                next();
            }
        });
    }

    async play() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();

                if (_.isEmpty(state)) {
                    await this.ss.play();
                } else {
                    await this.spotifyPlayerService.resume();
                }
                this.isPlaying = true;
            } finally {
                next();
            }
        });
    }

    async pause() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                if (_.isEmpty(state)) {
                    await this.ss.pause();
                } else {
                    await this.spotifyPlayerService.pause();
                }
                this.isPlaying = false;
            } finally {
                next();
            }
        });
    }

    async previous() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                if (_.isEmpty(state)) {
                    await this.ss.previous();
                } else {
                    await this.spotifyPlayerService.previouseTrack();
                }
            } finally {
                next();
            }
        });
    }

    async next() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                if (_.isEmpty(state)) {
                    await this.ss.next();
                } else {
                    await this.spotifyPlayerService.nextTrack();
                }
            } finally {
                next();
            }
        });
    }

    async volumeUp() {
        lockSection.push(async (next) => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                if (_.isEmpty(state)) {
                    const volume = this.volume;
                    await this.ss.volume(volume * 1.1);
                } else {
                    const volume = await this.spotifyPlayerService.getVolume();
                    this.volume = volume * 1.1;
                }
            } finally {
                next();
            }
        });
    }

    async volumeDown() {
        lockSection.push(async next => {
            try {
                const state = await this.spotifyPlayerService.getCurrentState();
                if (_.isEmpty(state)) {
                    const volume = this.volume;
                    await this.ss.volume(volume * 0.9);
                } else {
                    const volume = await this.spotifyPlayerService.getVolume();
                    this.volume = volume * 0.9;
                }
            } finally {
                next();
            }
        });
    }

    async likeTrack() {
        lockSection.push(async (next) => {
            if (!this.currentTrack) {
                return;
            }
            const stateResult = await this.ss.addTracks(this.currentTrack);
            stateResult.assert(e => this.errors = [e]);

            next();
        });
    }

    async unlikeTrack() {
        lockSection.push(async (next) => {
            if (!this.currentTrack) {
                return;
            }
            const stateResult = await this.ss.removeTracks(this.currentTrack);
            stateResult.assert(e => this.errors = [e]);

            next();
        });
    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.queue);
    }

    async resume() {
        await this.spotifyPlayerService.resume();
    }
}

export { MediaPlayerViewModel };
