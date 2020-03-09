import * as _ from 'underscore';
import { IRecommendationsResult, IResponseResult, ISpotifySong } from '../adapter/spotify';
import { ViewModel } from '../base/viewModel';
import { Service, SpotifyService } from '../service';
import { assertNoErrors, current } from '../utils';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';
import { TrackViewModelItem } from './trackViewModelItem';


class HomeViewModel extends ViewModel<HomeViewModel['settings']> {

    settings = {
        ...(this as any as ViewModel).settings,
        openLogin: false,
        likedTracks: [] as TrackViewModelItem[],
        selectedTrack: null as TrackViewModelItem,
        selectedPlaylist: null as PlaylistsViewModelItem,
        isLoading: false
    };

    refreshCommand = {
        exec: () => this.fetchData()
    };

    selectTrackCommand = {
        exec: (track: TrackViewModelItem) => this.prop('selectedTrack', track)
        
    };

    likeTrackCommand = {
        exec: (track: TrackViewModelItem) => this.likeTrack(track)
    };

    unlikeTrackCommand = {
        exec: (track: TrackViewModelItem) => this.unlikeTrack(track)
    };

    trackArray = [] as Array<TrackViewModelItem>;

    isInit = _.delay(() => {
        this.connect();
        this.fetchData();
    }, 100);

    constructor(private ss = current(Service)) {
        super();

        this.ss.spotifyPlayer();
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
        const trackIds = _.first(_.uniq(_.map(tracks.items, (song) => song.track.id)), 5);
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

    tracks(value?: any[]) {
        if (arguments.length && value !== this.trackArray) {
            this.trackArray = value;
            this.trigger('change:tracks');
        }

        return this.trackArray;
    }

    selectedPlaylist(value?: PlaylistsViewModelItem) {
        if (arguments.length && value !== this.settings.selectedPlaylist) {
            this.settings.selectedPlaylist = value;
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

    loadMore() {

    }

    playInTracks(item: TrackViewModelItem) {
        item.playTracks(this.tracks());
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
}

export { HomeViewModel };

