import { IAlbum } from './iAlbum';
import { IArtist } from './iArtist';

export interface ITrack {
    id: string;
    album: IAlbum;
    artists: IArtist[];
};
