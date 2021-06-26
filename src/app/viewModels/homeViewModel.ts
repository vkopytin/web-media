import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { IRecommendationsResult, IResponseResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, State } from '../utils';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


function isLoading(target, key, descriptor) {
    // save a reference to the original method this way we keep the values currently in the
    // descriptor and don't overwrite what another decorator might have done to the descriptor.
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    const originalMethod = descriptor.value;
   
    //editing the descriptor/value parameter
    descriptor.value = async function (this: HomeViewModel, ...args) {
        try {
            this.isLoading = true;
            return await originalMethod.apply(this, args);
        } finally {
            this.isLoading = false;
        }
    };
   
    // return edited descriptor as opposed to overwriting the descriptor
    return descriptor;
}

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
    
    refreshCommand$: BehaviorSubject<{ exec: () => Promise<void> }>;
    @State refreshCommand = { exec: () => this.fetchData() };

    selectTrackCommand$: BehaviorSubject<{ exec: () => Promise<void> }>;
    @State selectTrackCommand = { exec: (track: TrackViewModelItem) => this.selectedTrack = track };

    likeTrackCommand$: BehaviorSubject<{ exec: (track) => Promise<void> }>;
    @State likeTrackCommand = { exec: (track: TrackViewModelItem) => this.likeTrack(track) };

    unlikeTrackCommand$: BehaviorSubject<{ exec: (track) => Promise<void> }>;
    @State unlikeTrackCommand = { exec: (track: TrackViewModelItem) => this.unlikeTrack(track) };
    
    findTrackLyricsCommand$: BehaviorSubject<{ exec: (track) => Promise<void> }>;
    @State findTrackLyricsCommand = { exec: (track: TrackViewModelItem) => this.findTrackLyrics(track) };

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
    async fetchData() {
        const tracksResult = this.selectedPlaylist
            ? await this.ss.fetchPlaylistTracks(this.selectedPlaylist.id(), 0, 20)
            : await this.ss.fetchTracks(0, 20);
        if (assertNoErrors(tracksResult, e => this.errors = e)) {
            return;
        }
        const tracks = tracksResult.val as IResponseResult<ISpotifySong>;
        const artistIds = []; ///_.first(_.uniq(_.flatten(_.map(tracks.items, (song) => _.pluck(song.track.artists, 'id')))), 5);
        let trackIds = _.first(_.uniq(_.map(tracks.items, (song) => song.track.id)), 5);
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
        const tracksToCheck = tracks;
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        if (assertNoErrors(likedResult, e => this.errors = e)) {
            return;
        }
        _.each(likedResult.val as boolean[], (liked, index) => {
            tracksToCheck[index].isLiked = liked;
            this.likedTracks = _.filter(this.tracks, track => track.isLiked);
        });
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
        await track.likeTrack();
        this.checkTracks([track]);
    }

    async unlikeTrack(track: TrackViewModelItem) {
        await track.unlikeTrack();
        this.checkTracks([track]);
    }

    async bannTrack(track: TrackViewModelItem) {
        await this.ss.bannTrack(track.id());
        track.isBanned = true;
    }

    async removeBannFromTrack(track: TrackViewModelItem) {
        await this.ss.removeBannFromTrak(track.id());
        track.isBanned = false;
    }

    async findTrackLyrics(track: TrackViewModelItem) {
        if (this.trackLyrics && this.trackLyrics.trackId === track.id()) {
            return this.trackLyrics = null;
        }
        const lyricsResult = await this.ss.findTrackLyrics({
            name: track.name(),
            artist: track.artist()
        });
        if (assertNoErrors(lyricsResult, e => { })) {
            this.trackLyrics = {
                trackId: track.id(),
                lyrics: lyricsResult.error.message
            };
            return;
        }

        this.trackLyrics = {
            trackId: track.id(),
            lyrics: '' + lyricsResult.val
        };
    }
}

export { HomeViewModel };

