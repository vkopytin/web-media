import { IImageRecord } from './iImageRecord';
import { IArtistRecord } from './iArtistRecord';

export interface IAlbumRecord {
    album_type: string;
    id: string;
    name: string;
    uri: string;
    artists: IArtistRecord[];
    images: Array<IImageRecord>;
    total_tracks: number;
    release_date: string;
    external_urls: {
        spotify: string;
    };
}
