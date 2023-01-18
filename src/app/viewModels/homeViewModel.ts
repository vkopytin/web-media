import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IRecommendationsResult, IResponseResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { SpotifyPlayerService } from '../service/spotifyPlayer';
import { assertNoErrors, isLoading, State } from '../utils';
import { Result } from '../utils/result';
import { Scheduler } from '../utils/scheduler';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class HomeViewModel {
    errors$!: BehaviorSubject<HomeViewModel['errors']>;
    @State errors = [] as Result<Error, unknown>[];

    tracks$!: BehaviorSubject<HomeViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    likedTracks$!: BehaviorSubject<HomeViewModel['likedTracks']>;
    @State likedTracks = [] as TrackViewModelItem[];

    isLoading$!: BehaviorSubject<HomeViewModel['isLoading']>;
    @State isLoading = false;

    selectedTrack$!: BehaviorSubject<HomeViewModel['selectedTrack']>;
    @State selectedTrack: TrackViewModelItem | null = null;

    trackLyrics$!: BehaviorSubject<HomeViewModel['trackLyrics']>;
    @State trackLyrics: { trackId: string; lyrics: string } | null = null;

    selectedPlaylist$!: BehaviorSubject<HomeViewModel['selectedPlaylist']>;
    @State selectedPlaylist: PlaylistsViewModelItem | null = null;

    refreshCommand$!: BehaviorSubject<HomeViewModel['refreshCommand']>;
    @State refreshCommand = Scheduler.Command((trackId?: string) => this.fetchData(trackId));

    selectTrackCommand$!: BehaviorSubject<{ exec: () => Promise<void> }>;
    @State selectTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.selectedTrack = track);

    likeTrackCommand$!: BehaviorSubject<{ exec: (track: TrackViewModelItem) => Promise<void> }>;
    @State likeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.likeTrack(track));

    unlikeTrackCommand$!: BehaviorSubject<{ exec: (track: TrackViewModelItem) => Promise<void> }>;
    @State unlikeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.unlikeTrack(track));

    findTrackLyricsCommand$!: BehaviorSubject<{ exec: (track: TrackViewModelItem) => Promise<void> }>;
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));

    bannedTrackIds$!: BehaviorSubject<HomeViewModel['bannedTrackIds']>;
    @State bannedTrackIds = [] as string[];

    bannTrackCommand$!: BehaviorSubject<HomeViewModel['bannTrackCommand']>;
    @State bannTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.bannTrack(track));

    removeBannFromTrackCommand$!: BehaviorSubject<HomeViewModel['removeBannFromTrackCommand']>;
    @State removeBannFromTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.removeBannFromTrack(track));

    selectPlaylistCommand$!: BehaviorSubject<HomeViewModel['selectPlaylistCommand']>;
    @State selectPlaylistCommand = Scheduler.Command((playlist: PlaylistsViewModelItem) => this.selectPlaylist(playlist));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        await this.fetchData();

        resolve(true);
    }, 100));

    constructor(
        private spotifyService: SpotifyService,
        private spotifyPlayerService: SpotifyPlayerService,
        private ss: Service
    ) {

    }

    async connect() {
        this.spotifyService.on('change:state', (...args) => this.loadData(...args));
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
        lyricsResult.error(e => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: e.message || 'empy-error-message'
            };

            return this.errors = [lyricsResult];
        }).map(val => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: '' + val
            };
        });
    }

    async bannTrack(track: TrackViewModelItem) {
        await track.bannTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.error(e => this.errors = [res]).map(r => this.bannedTrackIds = r);
    }

    async removeBannFromTrack(track: TrackViewModelItem) {
        await track.removeBannFromTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.error(e => this.errors = [res]).map(r => this.bannedTrackIds = r);
    }
}

export { HomeViewModel };

