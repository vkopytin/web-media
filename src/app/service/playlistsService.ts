import { IMediaPort } from '../ports/iMediaProt';
import { State } from '../utils';
import { PlaylistsViewModelItem } from '../viewModels';


export class PlaylistsService {
    offset = 0;
    limit = 20;
    total = 0;
    @State playlists: PlaylistsViewModelItem[] = [];

    constructor(public mediaPort: IMediaPort) {

    }

    async init() {
        await this.listPlaylists();
    }

    async listPlaylists() {
        this.offset = 0;
        this.total = 0;
        const result = await this.mediaPort.myPlaylists(this.offset, this.limit + 1);
        this.total = this.offset + Math.min(this.limit + 1, result.items.length);
        this.offset = this.offset + Math.min(this.limit, result.items.length);
        this.playlists = result.items.slice(0, this.limit).map(item => new PlaylistsViewModelItem(item));
    }

    async loadMorePlaylists() {
        const result = await this.mediaPort.myPlaylists(this.offset, this.limit + 1);
        this.total = this.offset + Math.min(this.limit + 1, result.items.length);
        this.offset = this.offset + Math.min(this.limit, result.items.length);
        const playlists = result.items.slice(0, this.limit).map(item => new PlaylistsViewModelItem(item));

        this.playlistsAddRange(playlists);
    }

    private playlistsAddRange(value: PlaylistsViewModelItem[]): void {
        const array = [...this.playlists, ...value];
        this.playlists = array;
    }
}
