import * as _ from 'underscore';
import { IResponseResult, ISpotifySong } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, State, ValueContainer } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { TrackViewModelItem } from './trackViewModelItem';

class MyTracksViewModel {
    errors$: ValueContainer<MyTracksViewModel['errors'], MyTracksViewModel>;
    @State errors = [] as ServiceResult<any, Error>[];

    tracks$: ValueContainer<MyTracksViewModel['tracks'], MyTracksViewModel>;
    @State tracks = [] as TrackViewModelItem[];

    likedTracks$: ValueContainer<MyTracksViewModel['likedTracks'], MyTracksViewModel>;
    @State likedTracks = [] as TrackViewModelItem[];

    isLoading$: ValueContainer<MyTracksViewModel['isLoading'], MyTracksViewModel>;
    @State isLoading = false;

    selectedItem$: ValueContainer<MyTracksViewModel['selectedItem'], MyTracksViewModel>;
    @State selectedItem = null as TrackViewModelItem;

    trackLyrics$: ValueContainer<MyTracksViewModel['trackLyrics'], MyTracksViewModel>;
    @State trackLyrics = null as { trackId: string; lyrics: string };
    
    settings = {
        total: 0,
        limit: 20,
        offset: 0
    };

    loadMoreCommand$: ValueContainer<MyTracksViewModel['loadMoreCommand'], MyTracksViewModel>;
    @State loadMoreCommand = Scheduler.Command(() => this.loadMore());
    findTrackLyricsCommand$: ValueContainer<MyTracksViewModel['findTrackLyricsCommand'], MyTracksViewModel>;
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        await this.fetchData();
        resolve(true);
    }));

    constructor(private ss = current(Service)) {
        
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        spotifyResult.assert(e => this.errors = [e]).cata(spotify => {
            spotify.on('change:state', (...args) => this.loadData(...args));
        });
    }

    async fetchData() {
        this.isLoading = true;
        this.settings.offset = 0;
        this.loadData('myTracks');
        const res = await this.ss.fetchTracks(this.settings.offset, this.settings.limit + 1);
        if (res.isError) {
            this.isLoading = false;
            return;
        }
        const tracks = res.val as IResponseResult<ISpotifySong>;
        this.settings.total = this.settings.offset + Math.min(this.settings.limit + 1, tracks.items.length);
        this.settings.offset = this.settings.offset + Math.min(this.settings.limit, tracks.items.length);
        this.tracks = _.map(tracks.items.slice(0, this.settings.limit), (song, index) => new TrackViewModelItem(song, index));
        this.checkTracks(this.tracks);

        this.isLoading = false;
    }

    async loadMore() {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading = true;
        this.loadData('myTracks');
        const res = await this.ss.fetchTracks(this.settings.offset, this.settings.limit + 1);
        if (assertNoErrors(res, e => this.errors = e)) {
            this.isLoading = false;
            return;
        }
        const tracks = res.val as IResponseResult<ISpotifySong>;
        this.settings.total = this.settings.offset + Math.min(this.settings.limit + 1, tracks.items.length);
        this.settings.offset = this.settings.offset + Math.min(this.settings.limit, tracks.items.length);
        const tracksItems = _.map(tracks.items.slice(0, this.settings.limit), (song, index) => new TrackViewModelItem(song, index));
        this.tracks = [...this.tracks, ...tracksItems];
        this.checkTracks(tracksItems);
        this.isLoading = false;
    }

    async loadData(...args) {
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
        if (assertNoErrors(likedResult, e => this.errors = e)) {
            return;
        }
        _.each(likedResult.val as boolean[], (liked, index) => {
            tracksToCheck[index].isLiked = liked;
        });
        this.likedTracks = _.filter(this.tracks, track => track.isLiked);
    }

    tracksAddRange(value: TrackViewModelItem[]) {
        const array = [...this.tracks, ...value];
        this.tracks = array;
    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.tracks);
    }

    async findTrackLyrics(track: TrackViewModelItem) {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {
            return this.trackLyrics = null;
        }
        const lyricsResult = await this.ss.findTrackLyrics({
            name: track.name(),
            artist: track.artist()
        });
        if (assertNoErrors(lyricsResult, e => { })) {
            this.trackLyrics =  {
                trackId: track.id(),
                lyrics: lyricsResult.error.message
            };
            return;
        }

        this.trackLyrics = {
            trackId: track.id(),
            lyrics: '' + lyricsResult.val
        };
    }
}

export { MyTracksViewModel };

