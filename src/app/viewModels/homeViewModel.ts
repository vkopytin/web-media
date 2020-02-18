import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong } from '../service/adapter/spotify';


class HomeViewModel extends Events {

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

    constructor(private ss = new Service()) {
        super();

        this.ss.spotifyPlayer();
    }

    async fetchData() {
        const res = await this.ss.recentlyPlayed();
        if (res.isError) {
            return;
        }

        this.tracks(res.val as any);
    }

    tracks(value?: any[]) {
        if (arguments.length && value !== this.trackArray) {
            this.trackArray = _.map(value, (item) => new TrackViewModelItem(item));
            this.trigger('change:tracks');
        }

        return this.trackArray;
    }

    async resume() {
        const playerResult= await this.ss.spotifyPlayer();
        playerResult.val.resume();
    }
}

export { HomeViewModel };
