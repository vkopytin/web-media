import * as $ from 'jquery';
import { ErrorWithStatus } from './errors/errorWithStatus';


export interface ILyricsSearchResult {
    result: {
        track: {
            text: string;
        };
        copyright: {
            notice: string;
            articst: string;
            text: string;
        }
    };
}

class LyricsAdapter {

    constructor(public token: string) {
    }

    async search(term: string) {
        return new Promise<ILyricsSearchResult>((resolve, reject) => {
            $.ajax({
                url: 'https://orion.apiseeds.com/api/music/lyric/' + term,
                data: {
                    apikey: this.token
                },
                success(response) {
                    resolve(response);
                },
                error(jqXHR) {
                    reject(ErrorWithStatus.fromJqXhr(jqXHR));
                }
            });
        });
    }
}

export { LyricsAdapter };
