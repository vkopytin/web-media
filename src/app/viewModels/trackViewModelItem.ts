import { Events } from 'databindjs';
import { formatTime } from '../utils';
import { Service } from '../service';
import * as _ from 'underscore';
import { IDevice, ISpotifySong } from '../service/adapter/spotify';
import { current } from '../utils';
import { AppViewModel } from './appViewModel';


class TrackViewModelItem extends Events {
    appViewModel = current(AppViewModel);

    constructor(public song: ISpotifySong, private index: number, private ss = current(Service)) {
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

    uri() {
        return this.song.track.uri;
    }

    async play(playlistUri: string) {
        const device = this.appViewModel.currentDevice();

        this.ss.play(device.id(), playlistUri, this.uri());
    }

    async playTracks(tracks: TrackViewModelItem[], item: TrackViewModelItem) {
        const device = this.appViewModel.currentDevice();
        this.ss.play(device.id(), _.map(tracks, item => item.uri()), this.uri());
    }
}

export { TrackViewModelItem };
