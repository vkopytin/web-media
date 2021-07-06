import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IRecommendationsResult, IResponseResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { DataService } from '../service/dataService';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, isLoading, State } from '../utils';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class HomeViewModel {
    errors$: BehaviorSubject<HomeViewModel['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    tracks$: BehaviorSubject<HomeViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    likedTracks$: BehaviorSubject<HomeViewModel['likedTracks']>;
    @State likedTracks = [] as TrackViewModelItem[];

    isLoading$: BehaviorSubject<HomeViewModel['isLoading']>;
    @State isLoading = false;

    selectedTrack$: BehaviorSubject<HomeViewModel['selectedTrack']>;
    @State selectedTrack = null as TrackViewModelItem;

    trackLyrics$: BehaviorSubject<HomeViewModel['trackLyrics']>;
    @State trackLyrics = null as { trackId: string; lyrics: string };

    selectedPlaylist$: BehaviorSubject<HomeViewModel['selectedPlaylist']>;
    @State selectedPlaylist = null as PlaylistsViewModelItem;
    
    refreshCommand$: BehaviorSubject<HomeViewModel['refreshCommand']>;
    @State refreshCommand = { exec: (trackId?: string) => this.fetchData(trackId) };

    selectTrackCommand$: BehaviorSubject<{ exec: () => Promise<void> }>;
    @State selectTrackCommand = { exec: (track: TrackViewModelItem) => this.selectedTrack = track };

    likeTrackCommand$: BehaviorSubject<{ exec: (track) => Promise<void> }>;
    @State likeTrackCommand = { exec: (track: TrackViewModelItem) => this.likeTrack(track) };

    unlikeTrackCommand$: BehaviorSubject<{ exec: (track) => Promise<void> }>;
    @State unlikeTrackCommand = { exec: (track: TrackViewModelItem) => this.unlikeTrack(track) };
    
    findTrackLyricsCommand$: BehaviorSubject<{ exec: (track) => Promise<void> }>;
    @State findTrackLyricsCommand = { exec: (track: TrackViewModelItem) => this.findTrackLyrics(track) };

    bannedTrackIds$: BehaviorSubject<HomeViewModel['bannedTrackIds']>;
    @State bannedTrackIds = [] as string[];

    bannTrackCommand$: BehaviorSubject<HomeViewModel['bannTrackCommand']>;
    @State bannTrackCommand = { exec: (track: TrackViewModelItem) => this.bannTrack(track) };

    removeBannFromTrackCommand$: BehaviorSubject<HomeViewModel['removeBannFromTrackCommand']>;
    @State removeBannFromTrackCommand = { exec: (track: TrackViewModelItem) => this.removeBannFromTrack(track) };

    isInit = _.delay(() => {
        this.connect();
        this.fetchData();
        this.selectedPlaylist$.subscribe(() => {
            this.fetchData();
        });
    }, 100);

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
        if (assertNoErrors(likedResult, e => this.errors = e)) {
            return;
        }
        _.each(likedResult.val as boolean[], (liked, index) => {
            tracksToCheck[index].isLiked = liked;
            this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        });
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));
        this.bannedTrackIds = res.assert(e => this.errors = [e]).map(r => r);
    }

    loadMore() {

    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.tracks);
    }

    async resume() {
        const playerResult= await this.ss.spotifyPlayer();
        playerResult.val.resume();
    }

    async likeTrack(track: TrackViewModelItem) {
        const res = await track.likeTrack();
        res.assert(e => this.errors = [e]).map(() => {
            this.checkTracks([track]);
        });
    }

    async unlikeTrack(track: TrackViewModelItem) {
        const res = await track.unlikeTrack();
        res.assert(e => this.errors = [e]).map(() => {
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
        }).map(() => {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: '' + lyricsResult.val
            };
        });
    }

    async bannTrack(track: TrackViewModelItem) {
        await track.bannTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        this.bannedTrackIds = res.assert(e => this.errors = [e]).map(r => r);
    }

    async removeBannFromTrack(track: TrackViewModelItem) {
        await track.removeBannFromTrack();
        const res = await this.ss.listBannedTracks(this.tracks.map(track => track.id()));

        this.bannedTrackIds = res.assert(e => this.errors = [e]).map(r => r);
    }
}

export { HomeViewModel };

