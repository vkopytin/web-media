import { Events } from 'databindjs';
import * as _ from 'underscore';
import { IUserPlaylist } from '../service/adapter/spotify';


class PlaylistViewModelItem extends Events {
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
}

export { PlaylistViewModelItem };
