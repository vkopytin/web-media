import { Events } from 'databindjs';
import * as _ from 'underscore';
import { IAlbum } from '../service/adapter/spotify';


class AlbumViewModelItem extends Events {
    constructor(public album: IAlbum) {
        super();
    }

    id() {
        return this.album.id;
    }


    name() {
        return this.album.name;
    }

    uri() {
        return this.album.uri;
    }

    thumbnailUrl() {
        return _.first(this.album.images).url;
    }

    releaseDate() {
        return this.album.release_date;
    }

    totalTracks() {
        return this.album.total_tracks;
    }
}

export { AlbumViewModelItem };
