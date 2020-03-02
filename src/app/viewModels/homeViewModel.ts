import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';
import { TrackViewModelItem } from './trackViewModelItem';
import * as _ from 'underscore';
import { ISpotifySong, IRecommendationsResult, IResponseResult, ITrack } from '../service/adapter/spotify';
import { current, assertNoErrors } from '../utils';
import { ServiceResult } from '../base/serviceResult';


class HomeViewModel extends Events {

    settings = {
        openLogin: false,
        errors: [] as ServiceResult<any, Error>[],
        likedTracks: [] as TrackViewModelItem[]
    };

    refreshCommand = {
        exec: () => {
            this.fetchData();
        }
    }

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
        const tracksResult = await this.ss.fetchTracks(0, 20);
        if (assertNoErrors(tracksResult, e => this.errors(e))) {
            return;
        }
        const tracks = tracksResult.val as IResponseResult<ISpotifySong>;
        const artistIds = []; ///_.first(_.uniq(_.flatten(_.map(tracks.items, (song) => _.pluck(song.track.artists, 'id')))), 5);
        const trackIds = _.first(_.uniq(_.map(tracks.items, (song) => song.track.id)), 5);
        const res = await this.ss.fetchRecommendations('US', artistIds, trackIds);
    }

    async loadData(...args) {
        if (!~args.indexOf('recommendations')) {
            return;
        }
        const res = await this.ss.listRecommendations();
        if (res.isError) {
            return;
        }
        const recomendations = res.val as ITrack[];
        const newTracks = _.map(recomendations, (track, index) => new TrackViewModelItem({ track } as ISpotifySong, index));

        this.tracks(newTracks);
        this.checkTracks(newTracks);
    }

    async checkTracks(tracks: TrackViewModelItem[]) {
        const tracksToCheck = [];
        const tasks = _.map(tracks, async track => {
            const trackId = track.id();
            const isLikedTrackResult = await this.ss.isLiked(trackId);
            const isLiked = isLikedTrackResult.val as boolean;
            if (isLiked === null) {
                tracksToCheck.push(track);
            } else {
                track.isLiked(isLiked);
            }
        });
        await Promise.all(tasks);
        if (!tracksToCheck.length) {
            this.likedTracks(_.filter(this.tracks(), track => track.isLiked()));
            return;
        }
        const likedResult = await this.ss.hasTracks(_.map(tracksToCheck, t => t.id()));
        if (assertNoErrors(likedResult, e => this.errors(e))) {
            return;
        }
        _.each(likedResult.val as boolean[], (liked, index) => {
            tracksToCheck[index].isLiked(liked);
            this.likedTracks(_.filter(this.tracks(), track => track.isLiked()));
        });
    }

    errors(val?: ServiceResult<any, Error>[]) {
        if (arguments.length && val !== this.settings.errors) {
            this.settings.errors = val;
            this.trigger('change:errors');
        }

        return this.settings.errors;
    }

    tracks(value?: any[]) {
        if (arguments.length && value !== this.trackArray) {
            this.trackArray = value;
            this.trigger('change:tracks');
        }

        return this.trackArray;
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
        item.playTracks(this.tracks(), item);
    }

    async resume() {
        const playerResult= await this.ss.spotifyPlayer();
        playerResult.val.resume();
    }
}

export { HomeViewModel };
