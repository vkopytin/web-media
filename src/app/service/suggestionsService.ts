import { IMediaPort, ITrack } from '../ports/iMediaProt';
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
        const artistIds = [] as string[];
        let trackIds = trackId ? [trackId] : [];

        if (!trackIds.length) {
            if (this.selectedPlaylist) {
                const result = await this.media.listPlaylistTracks(this.selectedPlaylist.id(), 0, 5);
                trackIds = result.items.map(({ track }) => track.id);
            } else {
                const result = await this.media.tracks(0, 5);
                trackIds = result.items.map(({ track }) => track.id);
            }
        }

        if (!trackIds.length) {
            const topTracks = await this.media.myTopTracks();

            trackIds = topTracks.items.map((track) => track.id);
        }

        const recomendationsResult = await this.media.recommendations('US', artistIds, trackIds);

        const newTracks = recomendationsResult.tracks.map(TrackViewModelItem.fromTrack);
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
