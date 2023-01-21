import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IAlbum } from '../adapter/spotify';
import { State } from '../utils';
import { Result } from '../utils/result';

class AlbumViewModelItem {
    @State errors = [] as Result<Error, unknown>[];
    @State isLiked = false;

    constructor(public album: IAlbum) {

    }

    id() {
        return this.album.id;
    }

    name() {
        return this.album.name;
    }

    albumType() {
        return this.album.album_type;
    }

    firstArtist() {
        return _.first(this.album.artists)?.name || '';
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
        return _.first(this.album.images)?.url;
    }

    releaseDate() {
        return this.album.release_date;
    }

    totalTracks() {
        return this.album.total_tracks;
    }
}

export { AlbumViewModelItem };

