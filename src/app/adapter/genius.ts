import * as $ from 'jquery';
import { ErrorWithStatus } from './errors/errorWithStatus';


export interface IGeniuseHit {
    result: {
        url: string;
        path: string;
        api_path: string;
    };
}
export interface IGeniusSearchResult {
    lyrics: string;
}

class GeniusAdapter {

    constructor(public token: string) {
    }

    async search(term: string) {
        return new Promise<IGeniusSearchResult>((resolve, reject) => {
            $.ajax({
                url: 'https://api.lyrics.ovh/v1/' + term,
                success(response) {
                    resolve(response);
                },
                error(jqXHR, textStatus: string, errorThrown: string) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }
}

export { GeniusAdapter };
