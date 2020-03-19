import * as _ from 'underscore';
import { ISpotifySong, IUserPlaylist } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service, SpotifyService } from '../service';
import { assertNoErrors, current, formatTime } from '../utils';
import { AppViewModel } from './appViewModel';
import { PlaylistsViewModel } from './playlistsViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class TrackViewModelItem extends ViewModel {
    appViewModel = current(AppViewModel);
    playlistsViewModel = current(PlaylistsViewModel);
    settings = {
        ...(this as ViewModel).settings,
        isLiked: false,
        playlists: [] as PlaylistsViewModelItem[]
    };

    addToPlaylistCommand = { exec: (track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.addToPlaylist(track, playlist) };
    removeFromPlaylistCommand = { exec: (track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.removeFromPlaylist(track, playlist) };

    isInit = _.delay(() => {
        this.connect();
        this.loadData('playlistTracks');
    });

    constructor(public song: ISpotifySong, private index: number, private ss = current(Service)) {
        super();
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

    id() {
        return this.song.track.id;
    }

    name() {
        return this.song.track.name;
    }

    album() {
        return this.song.track.album?.name || '<Missing album>';
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
        const image = _.last(this.song.track.album?.images);
        return image?.url;
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
        const playlistsByTrackResult = await this.ss.listPlaylistsByTrack(this.id());
        if (assertNoErrors(playlistsByTrackResult, e => this.errors(e))) {
            return;
        }
        const playlists = playlistsByTrackResult.val as IUserPlaylist[];
        this.playlists(_.map(playlists, playlist => new PlaylistsViewModelItem(playlist)));
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

    async addToPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.addTrackToPlaylist(track.song.track, playlist.playlist);
        if (assertNoErrors(result, e => this.errors(e))) {
            return;
        }
        this.loadData('playlistTracks');
    }

    async removeFromPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.removeTrackFromPlaylist(track.song.track, playlist.id());
        if (assertNoErrors(result, e => this.errors(e))) {
            return;
        }
        this.loadData('playlistTracks');
    }

    async likeTrack() {
        const result = await this.ss.addTracks(this.song.track);
        if (assertNoErrors(result, e => this.errors(e))) {
            return;
        }
    }

    async unlikeTrack() {
        const result = await this.ss.removeTracks(this.song.track);
        if (assertNoErrors(result, e => this.errors(e))) {
            return;
        }
    }
}

export { TrackViewModelItem };

