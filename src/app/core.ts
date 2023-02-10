import {
    LyricsAdapter,
    SpotifyMediaAdapter,
    SpotifyPlaybackAdapter,
    SpotifyRemotePlaybackAdapter
} from './adapter';
import {
    AppService,
    DataService,
    DataSyncService,
    LoginService,
    LogService,
    LyricsService,
    MediaService,
    PlaybackService,
    PlaylistsService,
    PlaylistTracksService,
    RemotePlaybackService,
    SettingsService,
    SuggestionsService
} from './service';
import { inject } from './utils/inject';
import { AlbumsViewModel } from './viewModels';
import { AppViewModel } from './viewModels/appViewModel';
import { HomeViewModel } from './viewModels/homeViewModel';
import { MediaPlayerViewModel } from './viewModels/mediaPlayerViewModel';
import { MyTracksViewModel } from './viewModels/myTracksViewModel';
import { NewReleasesViewModel } from './viewModels/newReleasesViewModel';
import { PlaylistsViewModel } from './viewModels/playlistsViewModel';
import { SearchViewModel } from './viewModels/searchViewModel';
import { UserProfileViewModel } from './viewModels/userProfileViewModel';

export class Core {
    logService = inject(LogService);
    settingsService = inject(SettingsService, SettingsService.makeDefaultSettings());
    lyricsAdapter = inject(LyricsAdapter, this.settingsService.get('spotify').map(({ accessToken: key }) => key).match(r => r, () => ''));
    spotifyMediaAdapter = inject(SpotifyMediaAdapter, this.settingsService.get('spotify').map(({ accessToken: key }) => key).match(r => r, () => ''));
    spotifyPlaybackAdapter = inject(SpotifyPlaybackAdapter);
    spotifyRemotePlaybackAdapter = inject(SpotifyRemotePlaybackAdapter, this.settingsService.get('spotify').map(({ accessToken: key }) => key).match(r => r, () => ''));
    dataService = inject(DataService);
    mediaService = inject(MediaService, this.spotifyMediaAdapter);
    dataSyncService = inject(DataSyncService, this.dataService, this.mediaService);
    playlistsService = inject(PlaylistsService, this.spotifyMediaAdapter, this.dataSyncService);
    playlistTracksService = inject(PlaylistTracksService, this.spotifyMediaAdapter);
    suggestionsService = inject(SuggestionsService, this.spotifyMediaAdapter);
    lyricsService = inject(LyricsService, this.lyricsAdapter);
    remotePlaybackService = inject(RemotePlaybackService, this.spotifyRemotePlaybackAdapter);
    loginService = inject(LoginService, this.settingsService);
    playbackService = inject(PlaybackService, this.spotifyPlaybackAdapter, this.settingsService);
    appService = inject(AppService, this.logService, this.settingsService, this.loginService, this.dataService, this.mediaService, this.playbackService, this.remotePlaybackService);
    appViewModel = inject(AppViewModel, this.logService, this.appService, this.loginService, this.dataSyncService, this.mediaService, this.playbackService, this.remotePlaybackService);
    homeViewModel = inject(HomeViewModel, this.logService, this.dataService, this.mediaService, this.playbackService, this.lyricsService, this.suggestionsService);
    mediaPlayerViewModel = inject(MediaPlayerViewModel, this.logService, this.appViewModel, this.mediaService, this.settingsService, this.playbackService, this.remotePlaybackService, this.appService);
    myTracksViewModel = inject(MyTracksViewModel, this.logService, this.mediaService, this.lyricsService);
    newReleasesViewModel = inject(NewReleasesViewModel, this.logService, this.mediaService);
    playlistsViewModel = inject(PlaylistsViewModel, this.logService, this.dataService, this.lyricsService, this.playlistsService, this.playlistTracksService);
    searchViewModel = inject(SearchViewModel, this.logService, this.mediaService, this.settingsService);
    userProfileViewModel = inject(UserProfileViewModel, this.logService, this.appViewModel, this.loginService, this.settingsService, this.mediaService, this.appService);
    albumsViewModel = inject(AlbumsViewModel, this.logService);

    async run(): Promise<void> {
        await Promise.all([
            this.dataService.init(),
            this.playbackService.init(),
            this.appViewModel.init(),
            this.homeViewModel.init(),
            this.mediaPlayerViewModel.init(),
            this.myTracksViewModel.init(),
            this.newReleasesViewModel.init(),
            this.playlistsViewModel.init(),
            this.searchViewModel.init(),
            this.userProfileViewModel.init(),
        ]);
    }
}
