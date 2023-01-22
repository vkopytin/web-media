import * as _ from 'underscore';
import { IResponseResult, ISpotifySong } from '../adapter/spotify';
import { Service } from '../service';
import { DataService } from '../service/dataService';
import { formatTime, isLoading, State } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { MediaPlayerViewModel } from './mediaPlayerViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';

class TrackViewModelItem {
    mediaPlayerViewModel = inject(MediaPlayerViewModel);

    @State errors: Result[] = [];
    @State isLoading = false;
    @State isLiked = false;
    @State isCached = false;
    @State isBanned = false;
    @State trackPlaylists: PlaylistsViewModelItem[] = [];

    @State addToPlaylistCommand = Scheduler.Command((track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.addToPlaylist(track, playlist));
    @State removeFromPlaylistCommand = Scheduler.Command((track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.removeFromPlaylist(track, playlist));
    @State playTracksCommand = Scheduler.Command((tracks: TrackViewModelItem[]) => this.playTracks(tracks));
    @State updateIsCachedCommand = Scheduler.Command((playlists: PlaylistsViewModelItem[]) => this.updateIsCached(playlists));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.fetchData();
        resolve(true);
    }));

    constructor(
        public song: ISpotifySong,
        private index: number,
        private dataService = inject(DataService),
        private ss = inject(Service)
    ) {

    }

    id() {
        if (!this.song.track) {
            return '<Missing track>' + (+new Date());
        }

        return this.song.track.id;
    }

    name() {
        if (!this.song.track) {
            return '<Missing track>';
        }

        return this.song.track.name;
    }

    album() {
        if (!this.song.track) {
            return '<Can\'t read album. Missing track>';
        }
        if (!this.song.track.album) {
            return '<Missing album>';
        }

        return this.song.track.album?.name;
    }

    artist() {
        if (!this.song.track) {
            return '<Can\'t read artists. Missing track>';
        }
        const [artist] = this.song.track.artists;

        return (artist && artist.name) || '';
    }

    duration() {
        if (!this.song.track) {
            return 0;
        }

        return formatTime(this.song.track?.duration_ms || 0);
    }

    uri() {
        if (!this.song.track) {
            return '';
        }
        return this.song.track.uri;
    }

    thumbnailUrl() {
        if (!this.song.track) {
            return '';
        }
        if (!this.song.track.album) {
            return '';
        }
        const image = _.first(this.song.track.album?.images);
        return image?.url;
    }

    async fetchData() {
        this.listPlaylists();
        const res = await this.ss.isBannedTrack(this.song.track.id);
        res.map(r => this.isBanned = r).error(e => this.errors = [Result.error(e)]);
    }

    async listPlaylists() {
        const res = await this.dataService.listPlaylistsByTrack(this.song.track);

        return res
            .map(playlists => playlists.map(playlist => new PlaylistsViewModelItem(playlist)))
            .error(e => this.errors = [Result.error(e)]);
    }

    async play(playlistUri: string) {
        const playResult = await this.ss.play('', playlistUri, this.uri());
        playResult.map(() => this.mediaPlayerViewModel.fetchDataInternal())
            .error(e => this.errors = [Result.error(e)]);
    }

    async playTracks(tracks: TrackViewModelItem[]) {
        const allowedTracks = _.filter(tracks, track => !track.isBanned);
        const playResult = await this.ss.play('', _.map(allowedTracks, item => item.uri()), this.uri());
        playResult.map(() => this.mediaPlayerViewModel.fetchDataInternal())
            .error(e => this.errors = [Result.error(e)]);
    }

    @isLoading
    async addToPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.addTrackToPlaylist(track.song.track, playlist.playlist);
        result.map(() => setTimeout(() => {
            this.fetchData();
        }, 2000)).error(e => this.errors = [Result.error(e)]);
    }

    @isLoading
    async removeFromPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.removeTrackFromPlaylist(track.song.track, playlist.id());
        await result.map(() => this.fetchData()).error(e => this.errors = [Result.error(e)]);
    }

    async likeTrack(): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        const result = await this.ss.addTracks(this.song.track);
        result.error(e => this.errors = [Result.error(e)]);

        return result;
    }

    async unlikeTrack() {
        const result = await this.ss.removeTracks(this.song.track);
        result.error(e => this.errors = [Result.error(e)]);

        return result;
    }

    updateIsCached(playlists: PlaylistsViewModelItem[]) {
        this.trackPlaylists = playlists;
    }

    async bannTrack() {
        const res = await this.ss.bannTrack(this.id());
        res.map(r => this.isBanned = r).error(e => this.errors = [Result.error(e)]);
    }

    async removeBannFromTrack() {
        const res = await this.ss.removeBannFromTrak(this.id());
        res.map(r => this.isBanned = !r).error(e => this.errors = [Result.error(e)]);
    }

}

export { TrackViewModelItem };
