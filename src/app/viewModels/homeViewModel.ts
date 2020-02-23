import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IRecommendationsResult } from '../service/adapter/spotify';
import { current } from '../utils';


class HomeViewModel extends Events {

    settings = {
        openLogin: false
    };

    trackArray = [] as Array<TrackViewModelItem>;

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    async fetchData() {
        const res = await this.ss.recommendations();
        if (res.isError) {
            return;
        }
        const recomendations = res.val as IRecommendationsResult;

        this.tracks(_.map(recomendations.tracks, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index)));
    }

    tracks(value?: any[]) {
        if (arguments.length && value !== this.trackArray) {
            this.trackArray = value;
            this.trigger('change:tracks');
        }

        return this.trackArray;
    }

    loadMore() {

    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.tracks(), item);
    }

    async resume() {
        const playerResult= await this.ss.spotifyPlayer();
        playerResult.val.resume();
    }
}

export { HomeViewModel };
