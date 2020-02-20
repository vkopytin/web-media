import { Events } from 'databindjs';
import { Service } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { IResponseResult, IAlbum, ITrack } from '../service/adapter/spotify';
import { AlbumViewModelItem } from './albumViewModelItem';
import { current } from '../utils';


class NewReleasesViewModel extends Events {

    settings = {
        currentAlbum: null as AlbumViewModelItem
    };

    releasesArray = [] as Array<AlbumViewModelItem>;
    tracksArray = [] as TrackViewModelItem[];

    selectAlbumCommand = {
        exec: (album: AlbumViewModelItem) => {
            this.currentAlbum(album);
        }
    };

    isInit = _.delay(() => this.fetchData(), 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    async fetchData() {
        const res = await this.ss.newReleases();
        if (res.isError) {
            return;
        }
        const recomendations = res.val as IResponseResult<IAlbum>;

        this.newReleases(_.map(recomendations.items, album => new AlbumViewModelItem(album)));
    }

    async loadTracks() {
        const currentAlbum = this.currentAlbum();
        if (currentAlbum) {
            const result = await this.ss.listAlbumTracks(currentAlbum.id());
            if (result.isError) {
                return;
            }

            const tracks = result.val as IResponseResult<ITrack>;
        
            this.tracks(_.map(tracks.items, (item, index) => new TrackViewModelItem({
                track: {
                    ...item,
                    album: item.album || currentAlbum.album
                },
                played_at: ''
            }, index)));
        } else {
            this.tracks([]);
        }
    }

    newReleases(value?: AlbumViewModelItem[]) {
        if (arguments.length && value !== this.releasesArray) {
            this.releasesArray = value;
            this.trigger('change:newReleases');
        }

        return this.releasesArray;
    }

    currentAlbum(val?: AlbumViewModelItem) {
        if (arguments.length && this.settings.currentAlbum !== val) {
            this.settings.currentAlbum = val;
            this.trigger('change:currentAlbum');
            _.delay(() => this.loadTracks());
        }

        return this.settings.currentAlbum;
    }

    tracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.tracksArray !== val) {
            this.tracksArray = val;
            this.trigger('change:tracks');
        }

        return this.tracksArray;
    }

}

export { NewReleasesViewModel };
