import { LyricsAdapter } from './adapter/lyrics';
import { SpotifyAdapter } from './adapter/spotify';
import { AppService } from './service';
import { DataService } from './service/dataService';
import { LoginService } from './service/loginService';
import { LyricsService } from './service/lyricsService';
import { SettingsService } from './service/settings';
import { SpotifyService } from './service/spotify';
import { SpotifyPlayerService } from './service/spotifyPlayer';
import { SpotifySyncService } from './service/spotifySyncService';
import { inject } from './utils/inject';
import { AppViewModel } from './viewModels/appViewModel';
import { HomeViewModel } from './viewModels/homeViewModel';
import { MediaPlayerViewModel } from './viewModels/mediaPlayerViewModel';
import { MyTracksViewModel } from './viewModels/myTracksViewModel';
import { NewReleasesViewModel } from './viewModels/newReleasesViewModel';
import { PlaylistsViewModel } from './viewModels/playlistsViewModel';
import { SearchViewModel } from './viewModels/searchViewModel';
import { UserProfileViewModel } from './viewModels/userProfileViewModel';

export class Core {
    settingsService = inject(SettingsService, SettingsService.makeDefaultSettings());
    lyricsAdapter = inject(LyricsAdapter, this.settingsService.get('apiseeds').map(({ key }) => key).match(r => r, () => ''));
    sptifyAdapter = inject(SpotifyAdapter, this.settingsService.get('spotify').map(({ accessToken: key }) => key).match(r => r, () => ''));
    lyricsService = inject(LyricsService, this.lyricsAdapter);
    dataService = inject(DataService);
    spotifyService = inject(SpotifyService, this.sptifyAdapter);
    loginService = inject(LoginService, this.settingsService);
    spotifySyncService = inject(SpotifySyncService, this.dataService, this.spotifyService);
    spotifyPlayerService = inject(SpotifyPlayerService, this.settingsService);
    appService = inject(AppService, this.settingsService, this.loginService, this.dataService, this.spotifyService, this.spotifySyncService, this.spotifyPlayerService);
    appViewModel = inject(AppViewModel, this.loginService, this.spotifySyncService, this.spotifyService, this.spotifyPlayerService, this.appService);
    homeViewModel = inject(HomeViewModel, this.dataService, this.spotifyService, this.spotifyPlayerService, this.lyricsService);
    mediaPlayerViewModel = inject(MediaPlayerViewModel, this.appViewModel, this.spotifyService, this.settingsService, this.spotifyPlayerService, this.appService);
    myTracksViewModel = inject(MyTracksViewModel, this.spotifyService, this.lyricsService);
    newReleasesViewModel = inject(NewReleasesViewModel, this.spotifyService);
    playlistsViewModel = inject(PlaylistsViewModel, this.dataService, this.spotifyService, this.lyricsService, this.appService);
    searchViewModel = inject(SearchViewModel, this.spotifyService, this.settingsService);
    userProfileViewModel = inject(UserProfileViewModel, this.appViewModel, this.loginService, this.settingsService, this.spotifyService, this.appService);

    async run(): Promise<void> {
        await Promise.all([
            this.spotifyPlayerService.init(),
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
