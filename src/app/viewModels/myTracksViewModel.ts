import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IResponseResult, ITrack } from '../service/adapter/spotify';
import { current, assertNoErrors } from '../utils';
import { ServiceResult } from '../base/serviceResult';


class MyTracksViewModel extends Events {

    settings = {
        errors: [] as ServiceResult<any, Error>[],
        total: 0,
        limit: 20,
        offset: 0,
        isLoading: false,
        likedTracks: [] as TrackViewModelItem[]
    };

    loadMoreCommand = {
        exec: () => this.loadMore()
    }
    trackArray = [] as Array<TrackViewModelItem>;

    isInit = _.delay(() => {
        this.connect();
        this.fetchData();
    }, 100);

    constructor(private ss = current(Service)) {
        super();
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        const spotify = spotifyResult.val;
        spotify.on('change:state', (...args) => this.loadData(...args));
    }

    async fetchData() {
        this.isLoading(true);
        this.settings.offset = 0;
        const res = await this.ss.fetchTracks(this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading(false);
            return;
        }
        const tracks = res.val as IResponseResult<ISpotifySong>;
        this.settings.total = tracks.total;
        this.settings.offset = tracks.offset + Math.min(this.settings.limit, tracks.items.length);
        this.tracks(_.map(tracks.items, (song, index) => new TrackViewModelItem(song, index)));
        this.checkTracks(this.tracks());

        this.isLoading(false);
    }

    async loadMore() {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading(true);
        const res = await this.ss.fetchTracks(this.settings.offset, this.settings.limit);
        if (assertNoErrors(res, e => this.errors(e))) {
            this.isLoading(false);
            return;
        }
        const tracks = res.val as IResponseResult<ISpotifySong>;
        this.settings.total = tracks.total;
        this.settings.offset = tracks.offset + Math.min(this.settings.limit, tracks.items.length);
        const tracksItems = _.map(tracks.items, (song, index) => new TrackViewModelItem(song, index));
        this.tracks([...this.tracks(), ...tracksItems]);
        this.checkTracks(tracksItems);
        this.isLoading(false);
    }

    async loadData(...args) {
        if (!~args.indexOf('myTracks')) {
            return;
        }
    }

    async checkTracks(tracks: TrackViewModelItem[]) {
        const tracksToCheck = tracks;
        this.likedTracks(_.filter(this.tracks(), track => track.isLiked()));
        if (!tracksToCheck.length) {
            return;
        }
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        if (assertNoErrors(likedResult, e => this.errors(e))) {
            return;
        }
        _.each(likedResult.val as boolean[], (liked, index) => {
            tracksToCheck[index].isLiked(liked);
        });
        this.likedTracks(_.filter(this.tracks(), track => track.isLiked()));
    }

    likedTracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.settings.likedTracks !== val) {
            this.settings.likedTracks = val;
            this.trigger('change:likedTracks');
        }

        return this.settings.likedTracks;
    }

    isLoading(val?) {
        if (arguments.length && val !== this.settings.isLoading) {
            this.settings.isLoading = val;
            this.trigger('change:isLoading');
        }

        return this.settings.isLoading;
    }

    tracks(value?: any[]) {
        if (arguments.length && value !== this.trackArray) {
            this.trackArray = value;
            this.trigger('change:tracks');
        }

        return this.trackArray;
    }

    tracksAddRange(value: TrackViewModelItem[]) {
        const array = [...this.trackArray, ...value];
        this.tracks(array);
    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.tracks(), item);
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }
}

export { MyTracksViewModel };
