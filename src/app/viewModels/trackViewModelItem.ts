import { Events } from 'databindjs';
import { formatTime, assertNoErrors } from '../utils';
import { Service, SpotifyService } from '../service';
import * as _ from 'underscore';
import { IDevice, ISpotifySong, IUserPlaylist } from '../service/adapter/spotify';
import { current } from '../utils';
import { AppViewModel } from './appViewModel';
import { MediaPlayerViewModel } from './mediaPlayerViewModel';
import { ServiceResult } from '../base/serviceResult';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class TrackViewModelItem extends Events {
    appViewModel = current(AppViewModel);
    settings = {
        errors: [] as ServiceResult<any, Error>[],
        isLiked: false,
        playlists: [] as PlaylistsViewModelItem[]
    };

    isInit = _.delay(() => {
        this.connect();
        this.loadData('myPlaylists');
    });

    constructor(public song: ISpotifySong, private index: number, private ss = current(Service)) {
        super();
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        const spotify = spotifyResult.val;
        spotify.on('change:state', (...args) => this.loadData(...args));
    }

    async loadData(...args) {
        if (!~args.indexOf('myPlaylists')) {
            return;
        }
        const result = await this.ss.playlistsByTrack(this.song.track.id);
        if (assertNoErrors(result, e => this.errors(e))) {
            return result;
        }

        const playlists = result.val as IUserPlaylist[];

        this.playlists(_.map(playlists, item => new PlaylistsViewModelItem(item)));
    }

    id() {
        return this.song.track.id;
    }

    name() {
        return this.song.track.name;
    }

    album() {
        return this.song.track.album.name;
    }

    duration() {
        return formatTime(this.song.track.duration_ms);
    }

    uri() {
        return this.song.track.uri;
    }

    thumbnailUrl() {
        const image = _.last(this.song.track.album.images);
        return image.url;
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }

    async play(playlistUri: string) {
        const device = this.appViewModel.currentDevice();

        this.ss.play(device?.id(), playlistUri, this.uri());
    }

    async playTracks(tracks: TrackViewModelItem[], item: TrackViewModelItem) {
        const device = this.appViewModel.currentDevice();
        const playResult = this.ss.play(device?.id(), _.map(tracks, item => item.uri()), this.uri());
        assertNoErrors(playResult, e => this.errors(e));
    }

    playlists(val?: PlaylistsViewModelItem[]) {
        if (arguments.length && this.settings.playlists !== val) {
            this.settings.playlists = val;
            this.trigger('change:playlists');
        }

        return this.settings.playlists;
    }

    isLiked(val?) {
        if (arguments.length && val !== this.settings.isLiked) {
            this.settings.isLiked = val;
            this.trigger('change:isLiked');
        }

        return this.settings.isLiked;
    }
}

export { TrackViewModelItem };
