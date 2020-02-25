import * as _ from 'underscore';
import { IResponseResult, ISpotifySong, IRecommendationsResult } from '../../service/adapter/spotify';
import { TrackData } from '../entities/trackData';
import { DataStorage } from '../dataStorage';
import { AlbumData } from '../entities/albumData';
import { ArtistData } from '../entities/artistData';
import { ImageData } from '../entities/imageData';
import { AlbumToImagesData } from '../entities/albumToImagesData';
import { asAsync } from '../../utils';
import { ArtistsToAlbumsData } from '../entities/artistsToAlbumsData';
import { ArtistsToTracksData } from '../entities/artistsToTracksData';
import { RecommendationsData } from '../entities/recommendationsData';


export async function importFromSpotifyRecommendationsResult(result: IRecommendationsResult, timestamp: number) {
    const queue = [];
    DataStorage.create(async (err, connection) => {
        const recommendations = new RecommendationsData(connection);

        _.each(result.tracks, (track, index) => {
            const trackId = track.id;
            queue.push(asAsync(recommendations, recommendations.refresh, trackId, {
                id: trackId,
                track: track,
                date: timestamp,
                index: index
            }));
        });

        connection.complete();
    });

    return Promise.all(queue);
}
