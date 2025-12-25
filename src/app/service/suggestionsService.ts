import { IMediaPort } from '../ports/iMediaProt';
import { State } from '../utils';
import { PlaylistsViewModelItem } from '../viewModels/playlistsViewModelItem';
import { TrackViewModelItem } from '../viewModels/trackViewModelItem';

export class SuggestionsService {
    @State tracks: TrackViewModelItem[] = [];
    @State selectedPlaylist: PlaylistsViewModelItem | null = null;
    @State likedTracks: TrackViewModelItem[] = [];

    constructor(private media: IMediaPort) {

    }

    async fetchData(trackId?: string): Promise<void> {
        let trackIds = trackId ? [trackId] : [];
        let tracks = '';

        if (!trackIds.length) {
            if (this.selectedPlaylist) {
                const result = await this.media.listPlaylistTracks(this.selectedPlaylist.id(), 0, 5);
                trackIds = result.items.map(({ track }) => track.id);
                tracks = result.items.map(({ track }) => track.name).join(', ');
            } else {
                const result = await this.media.tracks(0, 5);
                trackIds = result.items.map(({ track }) => track.id);
                tracks = result.items.map(({ track }) => track.name).join(', ');
            }
        }

        if (!trackIds.length) {
            const topTracks = await this.media.myTopTracks(0, 5);

            trackIds = topTracks.items.map((track) => track.id);
            tracks = topTracks.items.map((track) => track.name).join(', ');
        }

        const recomendationsResult = await this.media.search('track', tracks);

        const newTracks = recomendationsResult.tracks?.items.map(TrackViewModelItem.fromTrack);
        if (!newTracks) {
            this.tracks = [];
            return;
        }
        this.tracks = newTracks;

        await this.checkTracks(newTracks);
    }

    public async checkTracks(tracks: TrackViewModelItem[]): Promise<void> {
        if (!tracks.length) {
            return;
        }
        this.likedTracks = this.tracks.filter(track => track.isLiked);
        const tracksToCheck = tracks;
        const liked = await this.media.hasTracks(tracksToCheck.map(t => t.id()));
        liked.forEach((liked, index) => {
            tracksToCheck[index].isLiked = liked;
        });
        this.likedTracks = tracksToCheck.filter(t => t.isLiked);
    }
}
