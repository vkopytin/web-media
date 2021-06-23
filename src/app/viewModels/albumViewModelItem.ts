import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IAlbum } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { ViewModel } from '../base/viewModel';
import { State } from '../utils';

class AlbumViewModelItem extends ViewModel {
    errors$: BehaviorSubject<ServiceResult<any, Error>[]>;
    @State errors = [] as ServiceResult<any, Error>[];

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

