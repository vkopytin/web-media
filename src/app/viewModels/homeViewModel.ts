import * as _ from 'underscore';
import { ISpotifySong } from '../adapter/spotify';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { SpotifyPlayerService } from '../service/spotifyPlayer';
import { isLoading, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class HomeViewModel {
    @State errors: Result[] = [];
    @State tracks: TrackViewModelItem[] = [];
    @State likedTracks: TrackViewModelItem[] = [];
    @State isLoading = false;
    @State selectedTrack: TrackViewModelItem | null = null;
    @State trackLyrics: { trackId: string; lyrics: string } | null = null;
    @State selectedPlaylist: PlaylistsViewModelItem | null = null;
    @State bannedTrackIds: string[] = [];

    @State refreshCommand = Scheduler.Command((trackId?: string) => this.fetchData(trackId));
    @State selectTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.selectedTrack = track);
    @State likeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.likeTrack(track));
    @State unlikeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.unlikeTrack(track));
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));
    @State bannTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.bannTrack(track));
    @State removeBannFromTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.removeBannFromTrack(track));
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem) => this.selectPlaylist(playlist));

    constructor(
        private spotifyService: SpotifyService,
        private spotifyPlayerService: SpotifyPlayerService,
        private ss: Service
    ) {

    }

    async init() {
        await this.connect();
        await this.fetchData();
    }

    async connect() {
        this.spotifyService.on('change:state', (...args: unknown[]) => this.loadData(...args));
    }

    @isLoading
    async fetchData(trackId?: string) {
        const artistIds = [] as string[];
        let trackIds = trackId ? [trackId] : [];

        if (!trackIds.length) {
            const tracksResult = this.selectedPlaylist ? await this.ss.fetchPlaylistTracks(this.selectedPlaylist.id(), 0, 20)
                : await this.ss.fetchTracks(0, 20);

            const res = tracksResult.map(tracks => {
                trackIds = _.first(_.uniq(_.map(tracks.items, (song) => song.track.id)), 5);
            });
            res.error(() => this.errors = [res]);
        }

        if (!trackIds.length) {
            const topTracksResult = await this.ss.listTopTracks();

            const res = topTracksResult.map(topTracks => {
                trackIds = _.first(_.uniq(_.map(topTracks.items, (song) => song.id)), 5);
            });
            res.error(() => this.errors = [res]);
        }
        const recomendationsResult = await this.ss.fetchRecommendations('US', artistIds, trackIds);

        const res = recomendationsResult.map(recomendations => {
            const newTracks = _.map(recomendations.tracks, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index));
            this.tracks = newTracks;
            this.checkTracks(newTracks);
        });
        res.error(() => this.errors = [res]);
    }

    async loadData(...args: unknown[]) {
        if (!~args.indexOf('recommendations')) {
            return;
        }
    }

    async checkTracks(tracks: TrackViewModelItem[]) {
        if (!tracks.length) {
            return;
        }
        const tracksToCheck = tracks;
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        const res1 = likedResult.map(liked => _.each(liked, (liked, index) => {
            tracksToCheck[index].isLiked = liked;
            this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        }));
        res1.error(() => this.errors = [res1]);

        const bannedTrackIdsResult = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));
        const res2 = bannedTrackIdsResult.map(r => this.bannedTrackIds = r);
        res2.error(() => this.errors = [res2]);
    }

    loadMore() {

    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.tracks);
    }

    async resume() {
        await this.spotifyPlayerService.resume();
    }

    async selectPlaylist(playlist: PlaylistsViewModelItem) {
        this.selectedPlaylist = playlist;
        await this.fetchData();
    }

    async likeTrack(track: TrackViewModelItem) {
        const res = await track.likeTrack();
        res.map(() => {
            this.checkTracks([track]);
        }).error((e) => this.errors = [Result.error(e)]);
    }

    async unlikeTrack(track: TrackViewModelItem) {
        const res = await track.unlikeTrack();
        res.map(() => {
            this.checkTracks([track]);
        }).error(e => this.errors = [Result.error(e)]);
    }

    async findTrackLyrics(track: TrackViewModelItem): Promise<void> {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {
            this.trackLyrics = null;
            return;
        }

        const lyricsResult = await this.ss.findTrackLyrics({
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

    async bannTrack(track: TrackViewModelItem) {
        await track.bannTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }

    async removeBannFromTrack(track: TrackViewModelItem) {
        await track.removeBannFromTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.map(r => this.bannedTrackIds = r).error(e => this.errors = [Result.error(e)]);
    }
}

export { HomeViewModel };

