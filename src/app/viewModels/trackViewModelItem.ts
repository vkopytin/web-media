import { ViewModel } from '../base/viewModel';
import { formatTime, assertNoErrors } from '../utils';
import { Service, SpotifyService } from '../service';
import * as _ from 'underscore';
import { IDevice, ISpotifySong, IUserPlaylist } from '../service/adapter/spotify';
import { current } from '../utils';
import { AppViewModel } from './appViewModel';
import { MediaPlayerViewModel } from './mediaPlayerViewModel';
import { ServiceResult } from '../base/serviceResult';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { listPlaylistsByTrack, addTrackToPlaylist, removeTrackFromPlaylist } from '../data/useCases';
import { PlaylistsViewModel } from './playlistsViewModel';


class TrackViewModelItem extends ViewModel {
    appViewModel = current(AppViewModel);
    playlistsViewModel = current(PlaylistsViewModel);
    settings = {
        ...(this as ViewModel).settings,
        isLiked: false,
        playlists: [] as PlaylistsViewModelItem[]
    };

    addToPlaylistCommand = {
        exec: (track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.addToPlaylist(track, playlist)
    };
    removeFromPlaylistCommand = {
        exec: (track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.removeFromPlaylist(track, playlist)
    };

    isInit = _.delay(() => {
        this.connect();
        this.loadData('playlistTracks');
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
        if (!~args.indexOf('playlistTracks')) {
            return;
        }
        this.playlists(this.playlistsViewModel.playlists());
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

    artist() {
        const [artist] = this.song.track.artists;
        return (artist && artist.name) || '';
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

    async play(playlistUri: string) {
        const device = this.appViewModel.currentDevice();

        this.ss.play(device?.id(), playlistUri, this.uri());
    }

    async playTracks(tracks: TrackViewModelItem[]) {
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

    async addToPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.addTrackToPlaylist(track.uri(), playlist.id());
        if (assertNoErrors(result, e => this.errors(e))) {
            return;
        }
        await addTrackToPlaylist(playlist.id(), track.song);
        this.loadData('playlistTracks');
    }

    async removeFromPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = this.ss.removeTrackFromPlaylist(track.uri(), playlist.id());
        if (assertNoErrors(result, e => this.errors(e))) {
            return;
        }
        await removeTrackFromPlaylist(playlist.id(), track.id());
        this.loadData('playlistTracks');
    }
}

export { TrackViewModelItem };
