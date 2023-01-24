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

    constructor(public apiKey: string) {
        this.apiKey = '9817ade5593e14c49ce4d97d362bc242';
    }

    async search({ artist, song }: { artist: string; song: string; }) {
        const encodedArtist = encodeURIComponent(artist);
        const encodedSong = encodeURIComponent(song);
        const request = await fetch(`//api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_artist=${encodedArtist}&q_track=${encodedSong}&format=json&apikey=${this.apiKey}`, {
            mode: 'no-cors',
            referrerPolicy: 'no-referrer',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Content-Type': 'text/plain; charset=utf-8',
            }
        });

        const text = await request.text();

        return {
            track: { text: text },
            copyright: {
                notice: 'musixmatch',
                text: '',
            }
        };
    }
}

export { LyricsAdapter };
