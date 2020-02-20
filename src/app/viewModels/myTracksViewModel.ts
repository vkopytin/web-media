import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IResponseResult } from '../service/adapter/spotify';
import { current } from '../utils';


class MyTracksViewModel extends Events {

    settings = {
        total: 0,
        limit: 20,
        offset: 0,
        isLoading: false
    };

    loadMoreCommand = {
        exec: () => this.loadMore()
    }
    trackArray = [] as Array<TrackViewModelItem>;

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    async fetchData() {
        this.isLoading(true);
        this.settings.offset = 0;
        const res = await this.ss.tracks(this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading(false);
            return;
        }
        const tracks = res.val as IResponseResult<ISpotifySong>;
        this.settings.total = tracks.total;
        this.settings.offset = tracks.offset + Math.min(this.settings.limit, tracks.items.length);

        this.tracks(_.map(tracks.items, (track, index) => new TrackViewModelItem(track, index)));
        this.isLoading(false);
    }

    async loadMore() {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading(true);
        const res = await this.ss.tracks(this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading(false);
            return;
        }
        const tracks = res.val as IResponseResult<ISpotifySong>;
        this.tracksAddRange(_.map(tracks.items, (track, index) => new TrackViewModelItem(track, this.settings.offset + index)));
        this.settings.total = tracks.total;
        this.settings.offset = tracks.offset + Math.min(this.settings.limit, tracks.items.length);
        this.isLoading(false);
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

}

export { MyTracksViewModel };
