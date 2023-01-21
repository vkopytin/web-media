import { LyricsAdapter } from './adapter/lyrics';
import { SpotifyAdapter } from './adapter/spotify';
import { Service } from './service';
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
    dataService = inject(DataService);
    settings = inject(SettingsService, SettingsService.makeDefaultSettings());
    lyricsAdapter = inject(LyricsAdapter, this.settings.get('apiseeds').map(({ key }) => key).match(r => r, e => ''));
    lyricsService = inject(LyricsService, this.lyricsAdapter);
    sptifyAdapter = inject(SpotifyAdapter, this.settings.get('spotify').map(({ accessToken: key }) => key).match(r => r, e => ''));
    spotify = inject(SpotifyService, this.sptifyAdapter);
    login = inject(LoginService, this.settings);
    spotifySync = inject(SpotifySyncService, this.spotify, this.dataService);
    spotifyPlayer = inject(SpotifyPlayerService, this.settings);
    service = inject(Service, this.settings, this.login, this.lyricsService, this.dataService, this.spotify, this.spotifySync, this.spotifyPlayer);
    appViewModel = inject(AppViewModel, this.spotifySync, this.spotify, this.spotifyPlayer, this.service);
    homeViewModel = inject(HomeViewModel, this.spotify, this.spotifyPlayer, this.service);
    mediaPlayerViewModel = inject(MediaPlayerViewModel, this.appViewModel, this.spotify, this.settings, this.spotifyPlayer, this.service);
    myTracksViewModel = inject(MyTracksViewModel, this.spotify, this.service);
    newReleasesViewModel = inject(NewReleasesViewModel, this.spotify, this.service);
    playlistsViewModel = inject(PlaylistsViewModel, this.service);
    searchViewModel = inject(SearchViewModel, this.spotify, this.settings, this.service);
    userProfileViewModel = inject(UserProfileViewModel, this.appViewModel, this.settings, this.service);

    async run(): Promise<void> {
        await Promise.all([
            this.spotifyPlayer.init(),
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
