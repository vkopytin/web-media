import { AppService, DataService, LyricsService, MediaService, PlaylistsService, PlaylistTracksService } from '../service';
import { Binding, isLoading, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';

class PlaylistsViewModel {
    @State errors: Result[] = [];
    @State isLoading = false;
    @State selectedItem: TrackViewModelItem | null = null;
    @State trackLyrics: { trackId: string; lyrics: string } | null = null;
    @State bannedTrackIds: string[] = [];

    @State loadMoreCommand = Scheduler.Command(() => this.loadMore());
    @State createPlaylistCommand = Scheduler.Command((isPublic: boolean) => this.createNewPlaylist(isPublic));
    @State selectPlaylistCommand = Scheduler.Command((playlistId: string | null) => {
        this.currentPlaylistId = playlistId;
        this.fetchTracks();
    });
    @State loadMoreTracksCommand = Scheduler.Command(() => this.loadMoreTracks());
    @State likeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.likeTrack(track));
    @State unlikeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.unlikeTrack(track));
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));
    @State reorderTrackCommand = Scheduler.Command((track: TrackViewModelItem, beforeTrack: TrackViewModelItem) => this.reorderTrack(track, beforeTrack));
    @State bannTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.bannTrack(track));
    @State removeBannFromTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.removeBannFromTrack(track));

    @Binding((vm: PlaylistsViewModel) => vm.playlistsService, 'newPlaylistName')
    newPlaylistName = '';
    @Binding((vm: PlaylistsViewModel) => vm.playlistsService, 'playlists')
    playlists: PlaylistsViewModelItem[] = [];
    @Binding((vm: PlaylistsViewModel) => vm.playlistTracksService, 'currentPlaylistId')
    currentPlaylistId: string | null = null;
    @Binding((vm: PlaylistsViewModel) => vm.playlistTracksService, 'tracks')
    tracks: TrackViewModelItem[] = [];
    @Binding((vm: PlaylistsViewModel) => vm.playlistTracksService, 'likedTracks')
    likedTracks: TrackViewModelItem[] = [];

    constructor(
        private data: DataService,
        private media: MediaService,
        private lyrics: LyricsService,
        private app: AppService,
        private playlistsService: PlaylistsService,
        private playlistTracksService: PlaylistTracksService,
    ) {

    }

    async init() {
        await this.fetchData();
    }

    async fetchData(): Promise<void> {
        await this.playlistsService.listPlaylists();
    }

    @isLoading
    async loadMore(): Promise<void> {
        await this.playlistsService.loadMorePlaylists();
    }

    async fetchTracks(): Promise<void> {
        await this.playlistTracksService.listPlaylistTracks();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));
        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }

    async loadMoreTracks(): Promise<void> {
        await this.playlistTracksService.loadMoreTracks();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));
        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }

    async createNewPlaylist(isPublic: boolean): Promise<void> {
        if (!this.newPlaylistName) {
            return;
        }
        await this.playlistsService.createNewPlaylist(isPublic);
        this.newPlaylistName = '';
    }

    async likeTrack(track: TrackViewModelItem): Promise<void> {
        await this.playlistTracksService.likeTrack(track);
    }

    async unlikeTrack(track: TrackViewModelItem): Promise<void> {
        await this.playlistTracksService.unlikeTrack(track);
    }

    async findTrackLyrics(track: TrackViewModelItem): Promise<void> {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {
            this.trackLyrics = null;
            return;
        }
        const lyricsResult = await this.lyrics.search({
            name: track.name(),
            artist: track.artist()
        });
        this.trackLyrics = lyricsResult.match(val => ({
            trackId: track.id(),
            lyrics: val
        }), e => ({
            trackId: track.id(),
            lyrics: e.message || 'unknown-error'
        }));
    }

    async reorderTrack(track: TrackViewModelItem, beforeTrack: TrackViewModelItem): Promise<void> {
        await this.playlistTracksService.reorderTrack(track, beforeTrack);
    }

    @isLoading
    async bannTrack(track: TrackViewModelItem): Promise<void> {
        await track.bannTrack();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }

    @isLoading
    async removeBannFromTrack(track: TrackViewModelItem): Promise<void> {
        await track.removeBannFromTrack();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }
}

export { PlaylistsViewModel };
