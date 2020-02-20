import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IResponseResult } from '../service/adapter/spotify';
import { current } from '../utils';


class MyTracksViewModel extends Events {

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
        const res = await this.ss.tracks();
        if (res.isError) {
            return;
        }
        const recomendations = res.val as IResponseResult<ISpotifySong>;

        this.tracks(_.map(recomendations.items, (track, index) => new TrackViewModelItem(track, index)));
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

export { MyTracksViewModel };
