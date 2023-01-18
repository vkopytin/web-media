import { LyricsAdapter } from '../adapter/lyrics';
import { SpotifyAdapter } from '../adapter/spotify';
import { Service } from '../service';
import { DataService } from '../service/dataService';
import { LoginService } from '../service/loginService';
import { LyricsService } from '../service/lyricsService';
import { SettingsService } from '../service/settings';
import { SpotifyService } from '../service/spotify';
import { SpotifyPlayerService } from '../service/spotifyPlayer';
import { SpotifySyncService } from '../service/spotifySyncService';
import { current } from '../utils';
import { AppViewModel } from './appViewModel';
import { HomeViewModel } from './homeViewModel';
import { MediaPlayerViewModel } from './mediaPlayerViewModel';
import { MyTracksViewModel } from './myTracksViewModel';
import { NewReleasesViewModel } from './newReleasesViewModel';
import { PlaylistsViewModel } from './playlistsViewModel';
import { SearchViewModel } from './searchViewModel';
import { UserProfileViewModel } from './userProfileViewModel';

export class Core {
    dataService = current(DataService);
    settings = current(SettingsService, SettingsService.makeDefaultSettings());
    lyricsAdapter = current(LyricsAdapter, this.settings.get('apiseeds').map(({ key }) => key).match(r => r, e => ''));
    lyricsService = current(LyricsService, this.lyricsAdapter);
    sptifyAdapter = current(SpotifyAdapter, this.settings.get('spotify').map(({ accessToken: key }) => key).match(r => r, e => ''));
    spotify = current(SpotifyService, this.sptifyAdapter);
    login = current(LoginService, this.settings);
    spotifySync = current(SpotifySyncService, this.spotify, this.dataService);
    spotifyPlayer = current(SpotifyPlayerService, this.settings);
    service = current(Service, this.settings, this.login, this.lyricsService, this.dataService, this.spotify, this.spotifySync, this.spotifyPlayer);
    appViewModel = current(AppViewModel, this.spotifySync, this.spotify, this.spotifyPlayer, this.service);
    homeViewModel = current(HomeViewModel, this.spotify, this.spotifyPlayer, this.service);
    mediaPlayerViewModel = current(MediaPlayerViewModel, this.appViewModel, this.spotify, this.settings, this.spotifyPlayer, this.service);
    myTracksViewModel = current(MyTracksViewModel, this.spotify, this.service);
    newReleasesViewModel = current(NewReleasesViewModel, this.spotify, this.service);
    playlistsViewModel = current(PlaylistsViewModel, this.service);
    searchViewModel = current(SearchViewModel, this.spotify, this.settings, this.service);
    userProfileViewModel = current(UserProfileViewModel, this.appViewModel, this.settings, this.service);

    async run(): Promise<void> {
        await this.spotifyPlayer.init();
    }
}
