import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IRecommendationsResult, IResponseResult, ITrack } from '../service/adapter/spotify';
import { current, asyncQueue } from '../utils';


const searchQueue = asyncQueue();

class SearchViewModel extends Events {

    settings = {
        term: ''
    };

    trackArray = [] as Array<TrackViewModelItem>;

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    async fetchData() {
        const res = await this.ss.search(this.term());
        if (res.isError) {
            return;
        }
        const recomendations = res.val as { tracks: IResponseResult<ITrack> };

        this.tracks(_.map(recomendations.tracks.items, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index)));
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

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.tracks(), item);
    }
}

export { SearchViewModel };
