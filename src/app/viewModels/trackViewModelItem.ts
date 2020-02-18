import { Events } from 'databindjs';
import { formatTime } from '../utils';


class TrackViewModelItem extends Events {
    constructor(public song) {
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
}

export { TrackViewModelItem };
