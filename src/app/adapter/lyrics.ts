import $ from 'jquery';
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
        const request = await fetch(`https://genius.com/${term}-lyrics`, {
            credentials: 'include',
            mode: 'no-cors',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        });

        const html = await request.text();

        return {
            track: { text: $('.lyrics', html).find('div:first').find('p:first').text() },
            copyright: {
                notice: 'Genius',
                text: '',
            }
        };
    }
}

export { LyricsAdapter };
