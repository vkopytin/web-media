import { Service } from '../service';
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
    service = current(Service);
    appViewModel = current(AppViewModel, this.service);
    homeViewModel = current(HomeViewModel, this.service);
    mediaPlayerViewModel = current(MediaPlayerViewModel, this.appViewModel, this.service);
    myTracksViewModel = current(MyTracksViewModel, this.service);
    newReleasesViewModel = current(NewReleasesViewModel, this.service);
    playlistsViewModel = current(PlaylistsViewModel, this.service);
    searchViewModel = current(SearchViewModel, this.appViewModel, this.service);
    userProfileViewModel = current(UserProfileViewModel, this.appViewModel, this.service);
}
