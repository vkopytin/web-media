import { BehaviorSubject } from 'rxjs';
import * as _ from 'underscore';
import { ISpotifySong } from '../adapter/spotify';
import { ServiceResult } from '../base/serviceResult';
import { Service } from '../service';
import { SpotifyService } from '../service/spotify';
import { assertNoErrors, current, formatTime, State } from '../utils';
import { AppViewModel } from './appViewModel';
import { PlaylistsViewModel } from './playlistsViewModel';
import { PlaylistsViewModelItem } from './playlistsViewModelItem';


class TrackViewModelItem {
    appViewModel = current(AppViewModel);
    playlistsViewModel = current(PlaylistsViewModel);

    errors$: BehaviorSubject<TrackViewModelItem['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    isLiked$: BehaviorSubject<TrackViewModelItem['isLiked']>;
    @State isLiked = false;

    isCached$: BehaviorSubject<TrackViewModelItem['isCached']>;
    @State isCached = false;

    allPlaylists$: BehaviorSubject<TrackViewModelItem['allPlaylists']>;
    @State allPlaylists = [] as PlaylistsViewModelItem[];
    
    settings = {
        isLiked: false,
        isCached: false,
    };

    addToPlaylistCommand$: BehaviorSubject<TrackViewModelItem['addToPlaylistCommand']>;
    @State addToPlaylistCommand = { exec: (track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.addToPlaylist(track, playlist) };

    removeFromPlaylistCommand$: BehaviorSubject<TrackViewModelItem['removeFromPlaylistCommand']>;
    @State removeFromPlaylistCommand = { exec: (track: TrackViewModelItem, playlist: PlaylistsViewModelItem) => this.removeFromPlaylist(track, playlist) };

    isInit = _.delay(() => {
        this.connect();
        this.allPlaylists$.subscribe((val) => {
            this.updateIsCached(val);
        })
    });

    constructor(public song: ISpotifySong, private index: number, private ss = current(Service)) {
 
    }

    id() {
        return this.song.track.id;
    }

    name() {
        return this.song.track.name;
    }

    album() {
        return this.song.track.album?.name || '<Missing album>';
    }

    artist() {
        const [artist] = this.song.track.artists;
        return (artist && artist.name) || '';
    }

    duration() {
        return formatTime(this.song.track.duration_ms);
    }

    uri() {
        return this.song.track.uri;
    }

    thumbnailUrl() {
        const image = _.last(this.song.track.album?.images);
        return image?.url;
    }

    async connect() {
        const spotifyResult = await this.ss.service(SpotifyService);
        if (assertNoErrors(spotifyResult, e => this.errors = e)) {
            return;
        }
        const spotify = spotifyResult.val;
    }

    async play(playlistUri: string) {
        this.ss.play(null, playlistUri, this.uri());
    }

    async playTracks(tracks: TrackViewModelItem[]) {
        const playResult = this.ss.play(null, _.map(tracks, item => item.uri()), this.uri());
        assertNoErrors(playResult, e => this.errors = e);
    }

    async addToPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.addTrackToPlaylist(track.song.track, playlist.playlist);
        if (assertNoErrors(result, e => this.errors = e)) {
            return;
        }
    }

    async removeFromPlaylist(track: TrackViewModelItem, playlist: PlaylistsViewModelItem) {
        const result = await this.ss.removeTrackFromPlaylist(track.song.track, playlist.id());
        if (assertNoErrors(result, e => this.errors = e)) {
            return;
        }
    }

    async likeTrack() {
        const result = await this.ss.addTracks(this.song.track);
        if (assertNoErrors(result, e => this.errors = e)) {
            return;
        }
    }

    async unlikeTrack() {
        const result = await this.ss.removeTracks(this.song.track);
        if (assertNoErrors(result, e => this.errors = e)) {
            return;
        }
    }

    updateIsCached(playlists: PlaylistsViewModelItem[]) {
    }
}

export { TrackViewModelItem };
