import { SuggestionsService } from '../service';
import { DataService } from '../service/dataService';
import { LyricsService } from '../service/lyricsService';
import { MediaService } from '../service/mediaService';
import { PlaybackService } from '../service/playbackService';
import { Binding, isLoading, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class HomeViewModel {
    @State errors: Result[] = [];
    @State isLoading = false;
    @State selectedTrack: TrackViewModelItem | null = null;
    @State trackLyrics: { trackId: string; lyrics: string } | null = null;
    @State bannedTrackIds: string[] = [];

    @State refreshCommand = Scheduler.Command((trackId: string) => this.fetchData(trackId));
    @State selectTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.selectedTrack = track);
    @State likeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.likeTrack(track));
    @State unlikeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.unlikeTrack(track));
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));
    @State bannTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.bannTrack(track));
    @State removeBannFromTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.removeBannFromTrack(track));
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem | null) => this.selectPlaylist(playlist));

    @Binding((vm: HomeViewModel) => vm.suggestions, 'tracks')
    tracks: TrackViewModelItem[] = [];
    @Binding((vm: HomeViewModel) => vm.suggestions, 'selectedPlaylist')
    selectedPlaylist: PlaylistsViewModelItem | null = null;
    @Binding((vm: HomeViewModel) => vm.suggestions, 'likedTracks')
    likedTracks: TrackViewModelItem[] = [];

    constructor(
        private data: DataService,
        private media: MediaService,
        private playback: PlaybackService,
        private lyrics: LyricsService,
        private suggestions: SuggestionsService,
    ) {

    }

    async init(): Promise<void> {
        try {
            await this.connect();
            await this.fetchData();
        } catch (ex) {
            this.errors = [Result.error(ex as Error)];
        }
    }

    connect(): void {
        this.media.on('change:state', (...args: unknown[]) => this.loadData(...args));
    }

    @isLoading
    async fetchData(trackId?: string): Promise<void> {
        await this.suggestions.fetchData(trackId);

        this.checkBannedTracks();
    }

    async loadData(...args: unknown[]): Promise<void> {
        if (!~args.indexOf('recommendations')) {
            return;
        }
    }

    async checkBannedTracks(): Promise<void> {
        const bannedTrackIdsResult = await this.data.listBannedTracks(this.tracks.map(track => track.id()));
        const res2 = bannedTrackIdsResult.map(r => this.bannedTrackIds = r);
        res2.error(() => this.errors = [res2]);
    }

    async playInTracks(item: TrackViewModelItem): Promise<void> {
        await item.playTracks(this.tracks);
    }

    async resume(): Promise<void> {
        await this.playback.resume();
    }

    async selectPlaylist(playlist: PlaylistsViewModelItem | null): Promise<void> {
        this.selectedPlaylist = playlist;
        await this.fetchData();
    }

    async likeTrack(track: TrackViewModelItem): Promise<void> {
        const res = await track.likeTrack();
        await res.map(async () => {
            this.suggestions.checkTracks([track]);
            await this.checkBannedTracks();
        }).error((e) => this.errors = [Result.error(e)]).await();
    }

    async unlikeTrack(track: TrackViewModelItem): Promise<void> {
        const res = await track.unlikeTrack();
        await res.map(async () => {
            await this.suggestions.checkTracks([track]);
            await this.checkBannedTracks();
        }).error(e => this.errors = [Result.error(e)]).await();
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
        this.trackLyrics = lyricsResult.match(val => {
            return {
                trackId: track.id(),
                lyrics: '' + val
            };
        }, e => {
            this.errors = [lyricsResult];
            return {
                trackId: track.id(),
                lyrics: e.message || 'empy-error-message'
            };
        });
    }

    async bannTrack(track: TrackViewModelItem): Promise<void> {
        await track.bannTrack();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }

    async removeBannFromTrack(track: TrackViewModelItem): Promise<void> {
        await track.removeBannFromTrack();
        const res = await this.data.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }
}

export { HomeViewModel };

