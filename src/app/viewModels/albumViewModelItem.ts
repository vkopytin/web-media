import * as _ from 'underscore';
import { IAlbum } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';


class AlbumViewModelItem extends ViewModel {

    settings = {
        ...(this as ViewModel).settings,
        isLiked: false
    };

    constructor(public album: IAlbum) {
        super();
    }

    isLiked(val?) {
        if (arguments.length && val !== this.settings.isLiked) {
            this.settings.isLiked = val;
            this.trigger('change:isLiked');
        }

        return this.settings.isLiked;
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

