import { IMediaPort } from '../ports/iMediaProt';
import { State } from '../utils';
import { TrackViewModelItem } from '../viewModels/trackViewModelItem';

export class PlaylistTracksService {
    offset = 0;
    limit = 20;
    total = 0;
    @State currentPlaylistId: string | null = '';
    @State tracks: TrackViewModelItem[] = [];
    @State likedTracks: TrackViewModelItem[] = [];

    constructor(private media: IMediaPort) {

    }

    async listPlaylistTracksByPlaylistId(playlistId: string | null) {
        this.currentPlaylistId = playlistId;
        await this.listPlaylistTracks();
    }

    async listPlaylistTracks() {
        if (!this.currentPlaylistId) {
            this.tracks = [];
            return;
        }
        this.offset = 0;
        this.total = 0;
        const result = await this.media.listPlaylistTracks(this.currentPlaylistId, this.offset, this.limit + 1);
        this.total = this.offset + Math.min(this.limit + 1, result.items.length);
        this.offset = this.offset + Math.min(this.limit, result.items.length);
        this.tracks = result.items.slice(0, this.limit).map((item, index) => new TrackViewModelItem(item, index));
        await this.checkTracks(this.tracks);
    }

    async loadMoreTracks() {
        if (!this.currentPlaylistId) {
            return;
        }
        const result = await this.media.listPlaylistTracks(this.currentPlaylistId, this.offset, this.limit + 1);
        const tracks = result.items.slice(0, this.limit).map((item, index) => new TrackViewModelItem(item, this.offset + index));
        this.total = this.offset + Math.min(this.limit + 1, result.items.length);
        this.offset = this.offset + Math.min(this.limit, result.items.length);

        this.playlistsAddRange(tracks);
        await this.checkTracks(tracks);
    }

    async likeTrack(track: TrackViewModelItem): Promise<void> {
        await track.likeTrack();
        await this.checkTracks([track]);
    }

    async unlikeTrack(track: TrackViewModelItem): Promise<void> {
        await track.unlikeTrack();
        await this.checkTracks([track]);
    }

    async reorderTrack(track: TrackViewModelItem, beforeTrack: TrackViewModelItem): Promise<void> {
        if (!this.currentPlaylistId) {
            return;
        }

        const tracks = this.tracks;
        const oldPosition = tracks.findIndex(t => t.id() === track.id());
        const newPosition = tracks.findIndex(t => t.id() === beforeTrack.id());
        const data = [...tracks];
        const item = data.splice(oldPosition, 1)[0];
        data.splice(newPosition, 0, item);

        if (oldPosition < newPosition) {
            await this.media.reorderTracks(this.currentPlaylistId, oldPosition, newPosition + 1);
        } else if (oldPosition > newPosition) {
            await this.media.reorderTracks(this.currentPlaylistId, oldPosition, newPosition);
        }
        this.tracks = data;
    }

    private playlistsAddRange(value: TrackViewModelItem[]): void {
        const array = [...this.tracks, ...value];
        this.tracks = array;
    }

    private async checkTracks(tracks: TrackViewModelItem[]): Promise<void> {
        if (!tracks.length) {
            return;
        }
        this.likedTracks = this.tracks.filter(track => track.isLiked);

        const tracksToCheck = tracks;
        const likedList = await this.media.hasTracks(tracksToCheck.map(t => t.id()));
        likedList.forEach((liked, index) => {
            tracksToCheck[index].isLiked = liked;
        });
        this.likedTracks = this.tracks.filter(track => track.isLiked);
    }
}
