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

    firstArtist() {
        return _.first(this.album.artists);
    }

    firstArtistUrl() {
        const artist = _.first(this.album.artists);
        if (!artist) {
            return '#';
        }
        return artist?.external_urls?.spotify || '';
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
