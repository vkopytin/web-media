import * as _ from 'underscore';
import { IAlbum } from '../ports/iMediaProt';
import { State } from '../utils';
import { Result } from '../utils/result';

class AlbumViewModelItem {
    @State errors: Result[] = [];
    @State isLiked = false;

    constructor(public album: IAlbum) {

    }

    id(): string {
        return this.album.id;
    }

    name(): string {
        return this.album.name;
    }

    albumType(): string {
        return this.album.album_type;
    }

    firstArtist(): string {
        return _.first(this.album.artists)?.name || '';
    }

    firstArtistUrl(): string {
        const artist = _.first(this.album.artists);
        if (!artist) {
            return '#';
        }
        return artist?.external_urls?.spotify || '';
    }

    uri(): string {
        return this.album.uri;
    }

    thumbnailUrl(): string {
        return _.first(this.album.images)?.url || '';
    }

    releaseDate(): string {
        return this.album.release_date;
    }

    totalTracks(): number {
        return this.album.total_tracks;
    }
}

export { AlbumViewModelItem };

