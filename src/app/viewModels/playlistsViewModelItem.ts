import { Events } from 'databindjs';
import * as _ from 'underscore';
import { IUserPlaylist } from '../service/adapter/spotify';


class PlaylistsViewModelItem extends Events {
    constructor(public playlist: IUserPlaylist) {
        super();
    }

    id() {
        return this.playlist.id;
    }

    uri() {
        return this.playlist.uri;
    }

    name() {
        return this.playlist.name;
    }

    owner() {
        return this.playlist.owner.display_name;
    }

    tracksTotal() {
        return this.playlist.tracks.total;
    }

    thumbnailUrl() {
        return _.first(this.playlist.images).url;
    }

    equals(inst: PlaylistsViewModelItem) {
        if (inst == null || inst == undefined) {
            return false;
        }

        if (this === inst) {
            return true;
        }

        if (!(inst instanceof PlaylistsViewModelItem)) {
            return false;
        }

        return this.playlist.id === inst.playlist.id;
    }
}

export { PlaylistsViewModelItem };
