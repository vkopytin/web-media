import { Events } from 'databindjs';
import { formatTime } from '../utils';
import { Service } from '../service';
import * as _ from 'underscore';
import { IDevice, ISpotifySong } from '../service/adapter/spotify';
import { current } from '../utils';
import { AppViewModel } from './appViewModel';


class TrackViewModelItem extends Events {
    appViewModel = current(AppViewModel);

    constructor(public song: ISpotifySong, private ss = new Service()) {
        super();
    }

    id() {
        return this.song.track.id;
    }

    name() {
        return this.song.track.name;
    }

    album() {
        return this.song.track.album.name;
    }

    duration() {
        return formatTime(this.song.track.duration_ms);
    }

    async play(playlistUri) {
        const device = this.appViewModel.currentDevice();

        this.ss.playerPlayTrack(device.id(), playlistUri, this.song.track.uri);
    }
}

export { TrackViewModelItem };
