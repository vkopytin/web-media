import { IMediaPort } from '../ports/iMediaProt';
import { State } from '../utils';
import { PlaylistsViewModelItem } from '../viewModels';
import { DataSyncService } from './dataSyncService';


export class PlaylistsService {
    offset = 0;
    limit = 20;
    total = 0;
    @State newPlaylistName = '';
    @State playlists: PlaylistsViewModelItem[] = [];

    constructor(
        private media: IMediaPort,
        private dataSyncService: DataSyncService,
    ) {

    }

    async listPlaylists() {
        this.offset = 0;
        this.total = 0;
        const result = await this.media.myPlaylists(this.offset, this.limit + 1);
        this.total = this.offset + Math.min(this.limit + 1, result.items.length);
        this.offset = this.offset + Math.min(this.limit, result.items.length);
        this.playlists = result.items.slice(0, this.limit).map(item => new PlaylistsViewModelItem(item));
    }

    async loadMorePlaylists() {
        const result = await this.media.myPlaylists(this.offset, this.limit + 1);
        this.total = this.offset + Math.min(this.limit + 1, result.items.length);
        this.offset = this.offset + Math.min(this.limit, result.items.length);
        const playlists = result.items.slice(0, this.limit).map(item => new PlaylistsViewModelItem(item));

        this.playlistsAddRange(playlists);
    }

    async createNewPlaylist(isPublic: boolean): Promise<void> {
        if (!this.newPlaylistName) {
            return;
        }
        const profile = await this.media.me();
        if (!profile?.id) {
            return;
        }

        await this.media.createNewPlaylist(profile.id, this.newPlaylistName, '', isPublic);

        await Promise.all([
            this.dataSyncService.syncMyPlaylists(),
            this.listPlaylists()
        ]);
    }

    private playlistsAddRange(value: PlaylistsViewModelItem[]): void {
        const array = [...this.playlists, ...value];
        this.playlists = array;
    }
}
