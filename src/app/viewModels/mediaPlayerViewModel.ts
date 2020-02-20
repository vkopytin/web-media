import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IRecommendationsResult } from '../service/adapter/spotify';
import { current } from '../utils';


class MediaPlayerViewModel extends Events {

    settings = {
        openLogin: false
    };

    resumeCommand = {
        exec: () => {
            this.ss.playerResume();
        }
    };

    pauseCommand = {
        exec: () => {
            this.ss.playerPause();
        }
    }

    prevCommand = {
        exec: () => {
            this.ss.playerPreviouseTrack();
        }
    }

    nextCommand = {
        exec: () => {
            this.ss.playerNextTrack();
        }
    }

    volumeUpCommand = {
        exec: () => {
            this.ss.playerVolumeUp();
        }
    }

    volumeDownCommand = {
        exec: () => {
            this.ss.playerVolumeDown();
        }
    }

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

        this.queue(_.map(recomendations.tracks, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index)));
    }

    queue(value?: any[]) {
        if (arguments.length && value !== this.trackArray) {
            this.trackArray = value;
            this.trigger('change:queue');
        }

        return this.trackArray;
    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.queue(), item);
    }

    async resume() {
        const playerResult= await this.ss.spotifyPlayer();
        playerResult.val.resume();
    }
}

export { MediaPlayerViewModel };
