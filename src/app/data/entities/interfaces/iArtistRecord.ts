import { IImageRecord } from './iImageRecord';


export interface IArtistRecord {
    external_urls: {
        spotify: string;
    };
    images: Array<IImageRecord>;
    spotify: string;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}
