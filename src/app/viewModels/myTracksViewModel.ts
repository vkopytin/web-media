import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IResponseResult, ISpotifySong } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { TrackViewModelItem } from './trackViewModelItem';

class MyTracksViewModel {
    errors$!: BehaviorSubject<MyTracksViewModel['errors']>;
    @State errors = [] as Result<Error, unknown>[];

    tracks$!: BehaviorSubject<MyTracksViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    likedTracks$!: BehaviorSubject<MyTracksViewModel['likedTracks']>;
    @State likedTracks = [] as TrackViewModelItem[];

    isLoading$!: BehaviorSubject<MyTracksViewModel['isLoading']>;
    @State isLoading = false;

    selectedItem$!: BehaviorSubject<MyTracksViewModel['selectedItem']>;
    @State selectedItem: TrackViewModelItem | null = null;

    trackLyrics$!: BehaviorSubject<MyTracksViewModel['trackLyrics']>;
    @State trackLyrics: { trackId: string; lyrics: string } | null = null;

    settings = {
        total: 1,
        limit: 20,
        offset: 0
    };

    loadMoreCommand$!: BehaviorSubject<MyTracksViewModel['loadMoreCommand']>;
    @State loadMoreCommand = Scheduler.Command(() => this.loadMore());
    findTrackLyricsCommand$!: BehaviorSubject<MyTracksViewModel['findTrackLyricsCommand']>;
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        await this.fetchData();
        resolve(true);
    }));

    constructor(
        private spotifyService: SpotifyService,
        private ss: Service,
    ) {

    }

    async connect() {
        this.spotifyService.on('change:state', (...args) => this.loadData(...args));
    }

    async fetchData() {
        this.isLoading = true;
        this.settings.offset = 0;
        this.loadData('myTracks');
        const res = await this.ss.fetchTracks(this.settings.offset, this.settings.limit + 1);
        res.map(tracks => {
            this.settings.total = this.settings.offset + Math.min(this.settings.limit + 1, tracks.items.length);
            this.settings.offset = this.settings.offset + Math.min(this.settings.limit, tracks.items.length);
            this.tracks = _.map(tracks.items.slice(0, this.settings.limit), (song, index) => new TrackViewModelItem(song, index));
            this.checkTracks(this.tracks);
        }).error(e => this.errors = [Result.error(e)]);

        this.isLoading = false;
    }

    async loadMore() {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading = true;
        this.loadData('myTracks');
        const res = await this.ss.fetchTracks(this.settings.offset, this.settings.limit + 1);
        res.map(tracks => {
            this.settings.total = this.settings.offset + Math.min(this.settings.limit + 1, tracks.items.length);
            this.settings.offset = this.settings.offset + Math.min(this.settings.limit, tracks.items.length);
            const tracksItems = _.map(tracks.items.slice(0, this.settings.limit), (song, index) => new TrackViewModelItem(song, index));
            this.tracks = [...this.tracks, ...tracksItems];
            this.checkTracks(tracksItems);
        }).error(e => this.errors = [Result.error(e)]);

        this.isLoading = false;
    }

    async loadData(...args: unknown[]) {
        if (!~args.indexOf('myTracks')) {
            return;
        }
    }

    async checkTracks(tracks: TrackViewModelItem[], offset = 0, limit = tracks.length) {
        const tracksToCheck = tracks.slice(offset, offset + 50);
        this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        if (!tracksToCheck.length) {
            return;
        }
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        likedResult.map(liked => {
            _.each(liked, (liked, index) => {
                tracksToCheck[index].isLiked = liked;
            });
            this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        }).error(e => this.errors = [Result.error(e)]);
    }

    tracksAddRange(value: TrackViewModelItem[]) {
        const array = [...this.tracks, ...value];
        this.tracks = array;
    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.tracks);
    }

    async findTrackLyrics(track: TrackViewModelItem): Promise<void> {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {
            this.trackLyrics = null;
            return;
        }
        const lyricsResult = await this.ss.findTrackLyrics({
            name: track.name(),
            artist: track.artist()
        });
        lyricsResult.error(e => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: e.message || 'unknown-error'
            };
            return;
        }).map(val => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: val
            };
        });
    }
}

export { MyTracksViewModel };

