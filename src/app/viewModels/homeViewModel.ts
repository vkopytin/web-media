import * as _ from 'underscore';
import { IRecommendationsResult, IResponseResult, ISpotifySong, ITrack } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service } from '../service';
import { assertNoErrors, current } from '../utils';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';
import { SpotifyService } from '../service/spotify';


class HomeViewModel extends ViewModel<HomeViewModel['settings']> {

    settings = {
        ...(this as any as ViewModel).settings,
        openLogin: false,
        tracks: [] as Array<TrackViewModelItem>,
        likedTracks: [] as TrackViewModelItem[],
        selectedTrack: null as TrackViewModelItem,
        selectedPlaylist: null as PlaylistsViewModelItem,
        isLoading: false,
        trackLyrics: null as { trackId: string; lyrics: string }
    };

    refreshCommand = { exec: () => this.fetchData() };
    selectTrackCommand = { exec: (track: TrackViewModelItem) => this.prop('selectedTrack', track) };
    likeTrackCommand = { exec: (track: TrackViewModelItem) => this.likeTrack(track) };
    unlikeTrackCommand = { exec: (track: TrackViewModelItem) => this.unlikeTrack(track) };
    findTrackLyricsCommand = { exec: (track: TrackViewModelItem) => this.findTrackLyrics(track) };

    isInit = _.delay(() => {
        this.connect();
        this.fetchData();
    }, 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
    }

    tracks(val?: any[]) {
        if (arguments.length && val !== this.settings.tracks) {
            this.settings.tracks = val;
            this.trigger('change:tracks');
        }

        return this.settings.tracks;
    }

    selectedPlaylist(val?: PlaylistsViewModelItem) {
        if (arguments.length && val !== this.settings.selectedPlaylist) {
            this.settings.selectedPlaylist = val;
            this.trigger('change:selectedPlaylist');
            this.fetchData();
        }

        return this.settings.selectedPlaylist;
    }

    likedTracks(val?: TrackViewModelItem[]) {
        if (arguments.length && this.settings.likedTracks !== val) {
            this.settings.likedTracks = val;
            this.trigger('change:likedTracks');
        }

        return this.settings.likedTracks;
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors(e))) {
            return;
        }
        const spotify = spotifyResult.val;
        spotify.on('change:state', (...args) => this.loadData(...args));
    }

    async fetchData() {
        this.prop('isLoading', true);
        const tracksResult = this.selectedPlaylist()
            ? await this.ss.fetchPlaylistTracks(this.selectedPlaylist().id(), 0, 20)
            : await this.ss.fetchTracks(0, 20);
        if (assertNoErrors(tracksResult, e => this.errors(e))) {
            return;
        }
        const tracks = tracksResult.val as IResponseResult<ISpotifySong>;
        const artistIds = []; ///_.first(_.uniq(_.flatten(_.map(tracks.items, (song) => _.pluck(song.track.artists, 'id')))), 5);
        let trackIds = _.first(_.uniq(_.map(tracks.items, (song) => song.track.id)), 5);
        if (!trackIds.length) {
            const topTracksResult = await this.ss.listTopTracks();
            if (assertNoErrors(topTracksResult, e => this.errors(e))) {
                return;
            }
            const topTracks = topTracksResult.val as IResponseResult<ITrack>;
            trackIds = _.first(_.uniq(_.map(topTracks.items, (song) => song.id)), 5);
        }
        const res = await this.ss.fetchRecommendations('US', artistIds, trackIds);
        if (assertNoErrors(res, e => this.errors(e))) {
            return;
        }
        const recomendations = res.val as IRecommendationsResult;
        const newTracks = _.map(recomendations.tracks, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index));
        this.tracks(newTracks);
        this.checkTracks(newTracks);
        this.prop('isLoading', false);
    }

    async loadData(...args) {
        if (!~args.indexOf('recommendations')) {
            return;
        }
    }

    async checkTracks(tracks: TrackViewModelItem[]) {
        const tracksToCheck = tracks;
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        if (assertNoErrors(likedResult, e => this.errors(e))) {
            return;
        }
        _.each(likedResult.val as boolean[], (liked, index) => {
            tracksToCheck[index].isLiked(liked);
            this.likedTracks(_.filter(this.tracks(), track => track.isLiked()));
        });
    }

    loadMore() {

    }

    playInTracks(item: TrackViewModelItem) {
        return item.playTracks(this.tracks());
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

    async findTrackLyrics(track: TrackViewModelItem) {
        if (this.prop('trackLyrics') && this.prop('trackLyrics').trackId === track.id()) {
            return this.prop('trackLyrics', null);
        }
        const lyricsResult = await this.ss.findTrackLyrics({
            name: track.name(),
            artist: track.artist()
        });
        if (assertNoErrors(lyricsResult, e => { })) {
            this.prop('trackLyrics', {
                trackId: track.id(),
                lyrics: lyricsResult.error.message
            });
            return;
        }

        this.prop('trackLyrics', {
            trackId: track.id(),
            lyrics: '' + lyricsResult.val
        });
    }
}

export { HomeViewModel };

