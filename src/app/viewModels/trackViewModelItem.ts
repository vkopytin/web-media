import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { ISpotifySong } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { DataService } from '../service/dataService';
import { SpotifyService } from '../service/spotify';
import { current, formatTime, isLoading, State } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { MediaPlayerViewModel } from './mediaPlayerViewModel';
import { PlaylistsViewModel } from './playlistsViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';

class TrackViewModelItem {
    mediaPlayerViewModel = current(MediaPlayerViewModel);

    errors$: BehaviorSubject<TrackViewModelItem['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    isLiked$: BehaviorSubject<TrackViewModelItem['isLiked']>;
    @State isLiked = false;

    isCached$: BehaviorSubject<TrackViewModelItem['isCached']>;
    @State isCached = false;

    trackPlaylists$: BehaviorSubject<TrackViewModelItem['trackPlaylists']>;
    @State trackPlaylists = [] as PlaylistsViewModelItem[];

    isBanned$: BehaviorSubject<TrackViewModelItem['isBanned']>;
    @State isBanned = false;

    isLoading$: BehaviorSubject<PlaylistsViewModel['isLoading']>;
    @State isLoading = false;

    settings = {
        isLiked: false,
        isCached: false,
    };

    addToPlaylistCommand$: BehaviorSubject<TrackViewModelItem['addToPlaylistCommand']>;
    @State addToPlaylistCommand = Scheduler.Command((track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.addToPlaylist(track, playlist));

    removeFromPlaylistCommand$: BehaviorSubject<TrackViewModelItem['removeFromPlaylistCommand']>;
    @State removeFromPlaylistCommand = Scheduler.Command((track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.removeFromPlaylist(track, playlist));

    playTracksCommand$: BehaviorSubject<TrackViewModelItem['playTracksCommand']>;
    @State playTracksCommand = Scheduler.Command((tracks: TrackViewModelItem[]) => this.playTracks(tracks));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        this.trackPlaylists$.subscribe((val) => {
            this.updateIsCached(val);
        });
        resolve(true);
    }));

    constructor(
        public song: ISpotifySong,
        private index: number,
        private ss = current(Service)
    ) {

    }

    id() {
        if (!this.song.track) {
            return '<Missing track>' + (+new Date());
        }

        return this.song.track.id;
    }

    name() {
        if (!this.song.track) {
            return '<Missing track>';
        }

        return this.song.track.name;
    }

    album() {
        if (!this.song.track) {
            return '<Can\'t read album. Missing track>';
        }
        if (!this.song.track.album) {
            return '<Missing album>';
        }

        return this.song.track.album?.name;
    }

    artist() {
        if (!this.song.track) {
            return '<Can\'t read artists. Missing track>';
        }
        const [artist] = this.song.track.artists;

        return (artist && artist.name) || '';
    }

    duration() {
        if (!this.song.track) {
            return 0;
        }

        return formatTime(this.song.track.duration_ms);
    }

    uri() {
        if (!this.song.track) {
            return '';
        }
        return this.song.track.uri;
    }

    thumbnailUrl() {
        if (!this.song.track) {
            return '';
        }
        if (!this.song.track.album) {
            return '';
        }
        const image = _.first(this.song.track.album?.images);
        return image?.url;
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        this.trackPlaylists = await spotifyResult.assert(e => this.errors = [e])
            .cata(() => this.listPlaylists());
        const res = await this.ss.isBannedTrack(this.song.track.id);
        res.assert(e => this.errors = [e]).cata(r => this.isBanned = r);
    }

    async listPlaylists() {
        const dataResult = await this.ss.service(DataService);
        const res = await dataResult.cata(data => data.listPlaylistsByTrack(this.song.track));

        return res.assert(e => this.errors = [e])
            .cata(playlists => playlists.map(playlist => new PlaylistsViewModelItem(playlist)));
    }

    async play(playlistUri: string) {
        const playResult = await this.ss.play(null, playlistUri, this.uri());
        playResult.assert(e => this.errors = [e]).map(() => this.mediaPlayerViewModel.fetchDataInternal());
    }

    async playTracks(tracks: TrackViewModelItem[]) {
        const allowedTracks = _.filter(tracks, track => !track.isBanned);
        const playResult = await this.ss.play(null, _.map(allowedTracks, item => item.uri()), this.uri());
        playResult.assert(e => this.errors = [e]).map(() => this.mediaPlayerViewModel.fetchDataInternal());
    }

    @isLoading
    async addToPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.addTrackToPlaylist(track.song.track, playlist.playlist);
        result.assert(e => this.errors = [e]).cata(() => setTimeout(() => {
            this.connect();
        }, 2000));
    }

    @isLoading
    async removeFromPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.removeTrackFromPlaylist(track.song.track, playlist.id());
        await result.assert(e => this.errors = [e]).cata(() => this.connect());
    }

    async likeTrack() {
        const result = await this.ss.addTracks(this.song.track);
        return result.assert(e => this.errors = [e]);
    }

    async unlikeTrack() {
        const result = await this.ss.removeTracks(this.song.track);
        return result.assert(e => this.errors = [e]);
    }

    updateIsCached(playlists: PlaylistsViewModelItem[]) {
    }

    async bannTrack() {
        const res = await this.ss.bannTrack(this.id());
        res.assert(e => this.errors = [e]).cata(r => this.isBanned = r);
    }

    async removeBannFromTrack() {
        const res = await this.ss.removeBannFromTrak(this.id());
        res.assert(e => this.errors = [e]).cata(r => this.isBanned = !r);
    }

}

export { TrackViewModelItem };
