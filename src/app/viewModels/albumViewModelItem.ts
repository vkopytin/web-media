import * as _ from 'underscore';
import { IAlbum } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { State, ValueContainer } from '../utils';

class AlbumViewModelItem {
    errors$: ValueContainer<AlbumViewModelItem['errors'], AlbumViewModelItem>;
    @State errors = [] as ServiceResult<any, Error>[];

    isLiked$: ValueContainer<AlbumViewModelItem['isLiked'], AlbumViewModelItem>;
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

