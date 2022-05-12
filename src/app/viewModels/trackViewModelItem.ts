import * as _ from 'underscore';
import { ISpotifySong } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { DataService } from '../service/dataService';
import { SpotifyService } from '../service/spotify';
import { current, formatTime, isLoading, State, ValueContainer } from '../utils';
import { Scheduler } from '../utils/scheduler';
import { AppViewModel } from './appViewModel';
import { MediaPlayerViewModel } from './mediaPlayerViewModel';
import { PlaylistsViewModel } from './playlistsViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';

class TrackViewModelItem {
    appViewModel = current(AppViewModel);
    playlistsViewModel = current(PlaylistsViewModel);
    mediaPlayerViewModel = current(MediaPlayerViewModel);

    errors$: ValueContainer<TrackViewModelItem['errors'], TrackViewModelItem>;
    @State errors = [] as ServiceResult<any, Error>[];

    isLiked$: ValueContainer<TrackViewModelItem['isLiked'], TrackViewModelItem>;
    @State isLiked = false;

    isCached$: ValueContainer<TrackViewModelItem['isCached'], TrackViewModelItem>;
    @State isCached = false;

    trackPlaylists$: ValueContainer<TrackViewModelItem['trackPlaylists'], TrackViewModelItem>;
    @State trackPlaylists = [] as PlaylistsViewModelItem[];

    isBanned$: ValueContainer<TrackViewModelItem['isBanned'], TrackViewModelItem>;
    @State isBanned = false;
    
    isLoading$: ValueContainer<PlaylistsViewModel['isLoading'], TrackViewModelItem>;
    @State isLoading = false;

    settings = {
        isLiked: false,
        isCached: false,
    };

    addToPlaylistCommand$: ValueContainer<TrackViewModelItem['addToPlaylistCommand'], TrackViewModelItem>;
    @State addToPlaylistCommand = Scheduler.Command((track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.addToPlaylist(track, playlist));

    removeFromPlaylistCommand$: ValueContainer<TrackViewModelItem['removeFromPlaylistCommand'], TrackViewModelItem>;
    @State removeFromPlaylistCommand = Scheduler.Command((track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.removeFromPlaylist(track, playlist));

    playTracksCommand$: ValueContainer<TrackViewModelItem['playTracksCommand'], TrackViewModelItem>;
    @State playTracksCommand = Scheduler.Command((tracks: TrackViewModelItem[]) => this.playTracks(tracks));

    isInit = new Promise<boolean>(resolve => _.delay(async () => {
        await this.connect();
        this.trackPlaylists$.subscribe((val) => {
            this.updateIsCached(val);
        }, this);
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
