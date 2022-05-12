import * as _ from 'underscore';
import { IRecommendationsResult, IResponseResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, isLoading, State, ValueContainer } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class HomeViewModel {
    errors$: ValueContainer<HomeViewModel['errors'], HomeViewModel>;
    @State errors = [] as ServiceResult<any, Error>[];

    tracks$: ValueContainer<HomeViewModel['tracks'], HomeViewModel>;
    @State tracks = [] as TrackViewModelItem[];

    likedTracks$: ValueContainer<HomeViewModel['likedTracks'], HomeViewModel>;
    @State likedTracks = [] as TrackViewModelItem[];

    isLoading$: ValueContainer<HomeViewModel['isLoading'], HomeViewModel>;
    @State isLoading = false;

    selectedTrack$: ValueContainer<HomeViewModel['selectedTrack'], HomeViewModel>;
    @State selectedTrack = null as TrackViewModelItem;

    trackLyrics$: ValueContainer<HomeViewModel['trackLyrics'], HomeViewModel>;
    @State trackLyrics = null as { trackId: string; lyrics: string };

    selectedPlaylist$: ValueContainer<HomeViewModel['selectedPlaylist'], HomeViewModel>;
    @State selectedPlaylist = null as PlaylistsViewModelItem;
    
    refreshCommand$: ValueContainer<HomeViewModel['refreshCommand'], HomeViewModel>;
    @State refreshCommand = Scheduler.Command((trackId?: string) => this.fetchData(trackId));

    selectTrackCommand$: ValueContainer<{ exec: () => Promise<void> }, HomeViewModel>;
    @State selectTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.selectedTrack = track);

    likeTrackCommand$: ValueContainer<{ exec: (track) => Promise<void> }, HomeViewModel>;
    @State likeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.likeTrack(track));

    unlikeTrackCommand$: ValueContainer<{ exec: (track) => Promise<void> }, HomeViewModel>;
    @State unlikeTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.unlikeTrack(track));

    findTrackLyricsCommand$: ValueContainer<{ exec: (track) => Promise<void> }, HomeViewModel>;
    @State findTrackLyricsCommand = Scheduler.Command((track: TrackViewModelItem) => this.findTrackLyrics(track));

    bannedTrackIds$: ValueContainer<HomeViewModel['bannedTrackIds'], HomeViewModel>;
    @State bannedTrackIds = [] as string[];

    bannTrackCommand$: ValueContainer<HomeViewModel['bannTrackCommand'], HomeViewModel>;
    @State bannTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.bannTrack(track));

    removeBannFromTrackCommand$: ValueContainer<HomeViewModel['removeBannFromTrackCommand'], HomeViewModel>;
    @State removeBannFromTrackCommand = Scheduler.Command((track: TrackViewModelItem) => this.removeBannFromTrack(track));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        await this.fetchData();
        this.selectedPlaylist$.subscribe(() => {
            this.fetchData();
        }, this);

        resolve(true);
    }, 100));

    constructor(private ss = current(Service)) {
        this.ss.spotifyPlayer();
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors = e)) {
            return;
        }
        const spotify = spotifyResult.val;
        spotify.on('change:state', (...args) => this.loadData(...args));
    }

    @isLoading
    async fetchData(trackId?: string) {
        const artistIds = [];
        let trackIds = trackId ? [trackId] : [];

        if (!trackIds.length) {
            const tracksResult = this.selectedPlaylist ? await this.ss.fetchPlaylistTracks(this.selectedPlaylist.id(), 0, 20)
                : await this.ss.fetchTracks(0, 20);

            if (assertNoErrors(tracksResult, e => this.errors = e)) {
                return;
            }

            const tracks = tracksResult.val as IResponseResult<ISpotifySong>;
            trackIds = _.first(_.uniq(_.map(tracks.items, (song) => song.track.id)), 5);
        }

        if (!trackIds.length) {
            const topTracksResult = await this.ss.listTopTracks();
            if (assertNoErrors(topTracksResult, e => this.errors = e)) {
                return;
            }
            const topTracks = topTracksResult.val as IResponseResult<ITrack>;
            trackIds = _.first(_.uniq(_.map(topTracks.items, (song) => song.id)), 5);
        }
        const res = await this.ss.fetchRecommendations('US', artistIds, trackIds);
        if (assertNoErrors(res, e => this.errors = e)) {
            return;
        }
        const recomendations = res.val as IRecommendationsResult;
        const newTracks = _.map(recomendations.tracks, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index));
        this.tracks = newTracks;
        this.checkTracks(newTracks);
    }

    async loadData(...args) {
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
        likedResult.assert(e => this.errors = [e]).cata(liked => _.each(liked, (liked, index) => {
            tracksToCheck[index].isLiked = liked;
            this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        }));

        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));
        res.assert(e => this.errors = [e]).cata(r => this.bannedTrackIds = r);
    }

    loadMore() {

    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.tracks);
    }

    async resume() {
        const playerResult = await this.ss.spotifyPlayer();
        playerResult.assert(e => this.errors = [e])
            .cata(player => player.resume());
    }

    async likeTrack(track: TrackViewModelItem) {
        const res = await track.likeTrack();
        res.assert(e => this.errors = [e]).cata(() => {
            this.checkTracks([track]);
        });
    }

    async unlikeTrack(track: TrackViewModelItem) {
        const res = await track.unlikeTrack();
        res.assert(e => this.errors = [e]).cata(() => {
            this.checkTracks([track]);
        });
    }

    async findTrackLyrics(track: TrackViewModelItem) {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {

            return this.trackLyrics = null;
        }

        const lyricsResult = await this.ss.findTrackLyrics({
            name: track.name(),
            artist: track.artist()
        });
        lyricsResult.assert(e => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: lyricsResult.error.message
            };
            
            return this.errors = [e];
        }).cata(() => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: '' + lyricsResult.val
            };
        });
    }

    async bannTrack(track: TrackViewModelItem) {
        await track.bannTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.assert(e => this.errors = [e]).cata(r => this.bannedTrackIds = r);
    }

    async removeBannFromTrack(track: TrackViewModelItem) {
        await track.removeBannFromTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        res.assert(e => this.errors = [e]).cata(r => this.bannedTrackIds = r);
    }
}

export { HomeViewModel };

