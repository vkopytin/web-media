import { withEvents } from 'databindjs';
import * as _ from 'underscore';
import { BaseService } from '../base/baseService';
import { Service } from '.';
import { LyricsServiceResult } from './results/lyricsServiceResult';
import { LyricsAdapter } from '../adapter/lyrics';
import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { LyricsServiceError } from './errors/lyricsServiceError';
import { LyricsServiceUnexpectedError } from './errors/lyricsServiceUnexpectedError';


function returnErrorResult<T>(message: string, ex: Error) {
    switch (true) {
        case ex instanceof ErrorWithStatus:
            const err = ex as ErrorWithStatus;
            return LyricsServiceError.create<T>(err.message, err);
        default:
            return LyricsServiceUnexpectedError.create<T>(message, ex);
    }
}

class LyricsService extends withEvents(BaseService) {
    constructor(public adapter: LyricsAdapter) {
        super();
    }

    async search(songInfo: { name: string; artist: string; }) {
        try {
            const lyrics = await this.adapter.search([songInfo.artist, songInfo.name].join('/'));

            return LyricsServiceResult.success([
                lyrics.result.track.text,
                '\nCopyright: ' + lyrics.result.copyright.notice,
                lyrics.result.copyright.text
            ].join('\n'));
        } catch (ex) {
            return returnErrorResult<string>('Unexpected error on requesting lyrics', ex as Error);
        }
    }
}

export { LyricsService };
