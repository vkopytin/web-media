import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IRecommendationsResult, IResponseResult, ITrack } from '../adapter/spotify';
import { current, asyncQueue } from '../utils';


const searchQueue = asyncQueue();

class SearchViewModel extends ViewModel {

    settings = {
        ...(this as ViewModel).settings,
        term: '',
        isLoading: false,
        offset: 0,
        total: 0,
        limit: 20
    };

    trackArray = [] as Array<TrackViewModelItem>;
    loadMoreCommand = {
        exec: () => this.loadMore()
    };

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    async fetchData() {
        this.isLoading(true);
        this.settings.offset = 0;
        const res = await this.ss.search(this.term(), this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading(false);
            return;
        }
        const search = res.val as { tracks: IResponseResult<ITrack> };
        this.settings.total = search.tracks.total;
        this.settings.offset = search.tracks.offset + Math.min(this.settings.limit, search.tracks.items.length);

        this.tracks(_.map(search.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index)));
        this.isLoading(false);
    }

    async loadMore() {
        if (this.settings.offset >= this.settings.total) {
            return;
        }
        this.isLoading(true);
        const res = await this.ss.search(this.term(), this.settings.offset, this.settings.limit);
        if (res.isError) {
            this.isLoading(false);
            return;
        }
        const search = res.val as { tracks: IResponseResult<ITrack> };
        this.tracksAddRange(_.map(search.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, search.tracks.offset + index)));

        this.settings.total = search.tracks.total;
        this.settings.offset = search.tracks.offset + Math.min(this.settings.limit, search.tracks.items.length);
        this.isLoading(false);
    }

    isLoading(val?) {
        if (arguments.length && val !== this.settings.isLoading) {
            this.settings.isLoading = val;
            this.trigger('change:isLoading');
        }

        return this.settings.isLoading;
    }


    term(val?) {
        if (arguments.length && val !== this.settings.term) {
            this.settings.term = val;
            this.trigger('change:term');

            searchQueue.push(_.bind(async function (this: SearchViewModel, next) {
                if (this.settings.term) {
                    await this.fetchData();
                    next();
                } else {
                    this.tracks([]);
                    next();
                }
            }, this));
        }

        return this.settings.term;
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
        item.playTracks(this.tracks());
    }
}

export { SearchViewModel };
