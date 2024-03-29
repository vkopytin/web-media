import * as _ from 'underscore';
import { IResponseResult, ISpotifySong, ITrack } from '../ports/iMediaProt';
import { AppService, LogService } from '../service';
import { DataService } from '../service/dataService';
import { RemotePlaybackService } from '../service/remotePlaybackService';
import { formatTime, isLoading, State } from '../utils';
import { inject } from '../utils/inject';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { MediaPlayerViewModel } from './mediaPlayerViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';

class TrackViewModelItem {
    static fromTrack(track: ITrack, index: number): TrackViewModelItem {
        const inst = new TrackViewModelItem({ track, added_at: '' }, index);
        inst.fetchData();

        return inst;
    }
    static fromSong(song: ISpotifySong, index: number): TrackViewModelItem {
        const inst = new TrackViewModelItem(song, index);
        inst.fetchData();

        return inst;
    }
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

    constructor(
        public song: ISpotifySong,
        private index: number,
        private logService = inject(LogService),
        private data = inject(DataService),
        private mediaPlayerViewModel = inject(MediaPlayerViewModel),
        private remotePlayback = inject(RemotePlaybackService),
        private app = inject(AppService)
    ) {

    }

    id(): string {
        if (!this.song.track) {
            return '<Missing track>' + (+new Date());
        }

        return this.song.track.id;
    }

    name(): string {
        if (!this.song.track) {
            return '<Missing track>';
        }

        return this.song.track.name;
    }

    album(): string {
        if (!this.song.track) {
            return '<Can\'t read album. Missing track>';
        }
        if (!this.song.track.album) {
            return '<Missing album>';
        }

        return this.song.track.album?.name;
    }

    artist(): string {
        if (!this.song.track) {
            return '<Can\'t read artists. Missing track>';
        }
        const [artist] = this.song.track.artists;

        return (artist && artist.name) || '';
    }

    duration(): string {
        if (!this.song.track) {
            return '0';
        }

        return formatTime(this.song.track?.duration_ms || 0);
    }

    uri(): string {
        if (!this.song.track) {
            return '';
        }

        return this.song.track.uri;
    }

    thumbnailUrl(): string | undefined {
        if (!this.song.track) {
            return '';
        }
        if (!this.song.track.album) {
            return '';
        }
        const image = _.first(this.song.track.album?.images);

        return image?.url;
    }

    async fetchData(): Promise<void> {
        const playlists = await this.listPlaylists();
        this.trackPlaylists = playlists.valueOrDefault([]);

        const res = await this.data.isBannedTrack(this.song.track.id);
        res.map(r => this.isBanned = r).error(this.logService.logError);
    }

    async listPlaylists(): Promise<Result<Error, PlaylistsViewModelItem[]>> {
        const res = await this.data.listPlaylistsByTrack(this.song.track);

        return res
            .map(playlists => playlists.map(playlist => PlaylistsViewModelItem.fromPlaylist(playlist)))
            .error(this.logService.logError);
    }

    async play(playlistUri: string): Promise<void> {
        const playResult = await this.remotePlayback.play('', playlistUri, this.uri());
        playResult.map(() => this.mediaPlayerViewModel.fetchData())
            .error(this.logService.logError);
    }

    async playTracks(tracks: TrackViewModelItem[]): Promise<void> {
        const allowedTracks = _.filter(tracks, track => !track.isBanned);
        const playResult = await this.remotePlayback.play('', _.map(allowedTracks, item => item.uri()), this.uri());
        playResult.map(() => this.mediaPlayerViewModel.fetchData())
            .error(this.logService.logError);
    }

    @isLoading
    async addToPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem): Promise<void> {
        const result = await this.app.addTrackToPlaylist(track.song.track, playlist.playlist);
        result.map(() => setTimeout(() => {
            this.fetchData();
        }, 2000)).error(this.logService.logError);
    }

    @isLoading
    async removeFromPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem): Promise<void> {
        const result = await this.app.removeTrackFromPlaylist(track.song.track, playlist.id());
        await result.map(() => this.fetchData()).error(this.logService.logError).await();
    }

    async likeTrack(): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        const result = await this.app.addTracks(this.song.track);
        result.error(this.logService.logError);

        return result;
    }

    async unlikeTrack(): Promise<Result<Error, IResponseResult<ISpotifySong>>> {
        const result = await this.app.removeTracks(this.song.track);
        result.error(this.logService.logError);

        return result;
    }

    updateIsCached(playlists: PlaylistsViewModelItem[]): void {
        this.trackPlaylists = playlists;
    }

    async bannTrack(): Promise<void> {
        const res = await this.data.bannTrack(this.id());
        res.map(r => this.isBanned = r).error(this.logService.logError);
    }

    async removeBannFromTrack(): Promise<void> {
        const res = await this.data.removeBannFromTrack(this.id());
        res.map(r => this.isBanned = !r).error(this.logService.logError);
    }

}

export { TrackViewModelItem };
