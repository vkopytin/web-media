import { LyricsAdapter } from './adapter/lyrics';
import { AppService } from './service';
import { DataService } from './service/dataService';
import { LoginService } from './service/loginService';
import { LyricsService } from './service/lyricsService';
import { SettingsService } from './service/settings';
import { MediaService } from './service/mediaService';
import { PlaybackService } from './service/playbackService';
import { DataSyncService } from './service/dataSyncService';
import { inject } from './utils/inject';
import { AppViewModel } from './viewModels/appViewModel';
import { HomeViewModel } from './viewModels/homeViewModel';
import { MediaPlayerViewModel } from './viewModels/mediaPlayerViewModel';
import { MyTracksViewModel } from './viewModels/myTracksViewModel';
import { NewReleasesViewModel } from './viewModels/newReleasesViewModel';
import { PlaylistsViewModel } from './viewModels/playlistsViewModel';
import { SearchViewModel } from './viewModels/searchViewModel';
import { UserProfileViewModel } from './viewModels/userProfileViewModel';
import { RemotePlaybackService } from './service/remotePlaybackService';
import { SpotifyMediaAdapter } from './adapter/spotifyMediaAdapter';
import { SpotifyRemotePlaybackAdapter } from './adapter/spotifyRemotePlaybackAdapter';
import { SpotifyPlaybackAdapter } from './adapter/spotifyPlaybackAdapter';
import { PlaylistsService } from './service/playlistsService';

export class Core {
    settingsService = inject(SettingsService, SettingsService.makeDefaultSettings());
    lyricsAdapter = inject(LyricsAdapter, this.settingsService.get('spotify').map(({ accessToken: key }) => key).match(r => r, () => ''));
    spotifyMediaAdapter = inject(SpotifyMediaAdapter, this.settingsService.get('spotify').map(({ accessToken: key }) => key).match(r => r, () => ''));
    spotifyPlaybackAdapter = inject(SpotifyPlaybackAdapter, typeof window === 'object' ? window : {} as any, typeof document === 'object' ? document : {} as any);
    spotifyRemotePlaybackAdapter = inject(SpotifyRemotePlaybackAdapter, this.settingsService.get('spotify').map(({ accessToken: key }) => key).match(r => r, () => ''));
    playlistsService = inject(PlaylistsService, this.spotifyMediaAdapter);
    lyricsService = inject(LyricsService, this.lyricsAdapter);
    dataService = inject(DataService);
    mediaService = inject(MediaService, this.spotifyMediaAdapter);
    remotePlaybackService = inject(RemotePlaybackService, this.spotifyRemotePlaybackAdapter);
    loginService = inject(LoginService, this.settingsService);
    dataSyncService = inject(DataSyncService, this.dataService, this.mediaService);
    playbackService = inject(PlaybackService, this.spotifyPlaybackAdapter, this.settingsService);
    appService = inject(AppService, this.settingsService, this.loginService, this.dataService, this.mediaService, this.dataSyncService, this.playbackService, this.remotePlaybackService);
    appViewModel = inject(AppViewModel, this.loginService, this.dataSyncService, this.mediaService, this.playbackService, this.remotePlaybackService, this.appService);
    homeViewModel = inject(HomeViewModel, this.dataService, this.mediaService, this.playbackService, this.lyricsService);
    mediaPlayerViewModel = inject(MediaPlayerViewModel, this.appViewModel, this.mediaService, this.settingsService, this.playbackService, this.remotePlaybackService, this.appService);
    myTracksViewModel = inject(MyTracksViewModel, this.mediaService, this.lyricsService);
    newReleasesViewModel = inject(NewReleasesViewModel, this.mediaService);
    playlistsViewModel = inject(PlaylistsViewModel, this.dataService, this.mediaService, this.lyricsService, this.appService, this.playlistsService);
    searchViewModel = inject(SearchViewModel, this.mediaService, this.settingsService);
    userProfileViewModel = inject(UserProfileViewModel, this.appViewModel, this.loginService, this.settingsService, this.mediaService, this.appService);

    async run(): Promise<void> {
        await Promise.all([
            this.dataService.init(),
            this.playlistsService.init(),
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
