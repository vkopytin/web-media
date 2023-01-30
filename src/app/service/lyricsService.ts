import { ErrorWithStatus } from '../adapter/errors/errorWithStatus';
import { Events } from '../events';
import { ILyricsPort } from '../ports/iLyricsPort';
import { Result } from '../utils/result';
import { LyricsServiceError } from './errors/lyricsServiceError';
import { LyricsServiceUnexpectedError } from './errors/lyricsServiceUnexpectedError';


function returnErrorResult<T>(message: string, ex: Error): Result<Error, T> {
    switch (true) {
        case ex instanceof ErrorWithStatus:
            const err = ex as ErrorWithStatus;
            return LyricsServiceError.of<T>(err.message, err);
        default:
            return LyricsServiceUnexpectedError.of<T>(message, ex);
    }
}

class LyricsService extends Events {
    constructor(public adapter: ILyricsPort) {
        super();
    }

    async search(songInfo: { name: string; artist: string; }): Promise<Result<Error, string>> {
        try {
            const lyrics = await this.adapter.search({
                artist: songInfo.artist,
                song: songInfo.name
            });

            return Result.of([
                lyrics.track.text,
                '\nCopyright: ' + lyrics.copyright.notice,
                lyrics.copyright.text
            ].join('\n'));
        } catch (ex) {
            return returnErrorResult<string>('Unexpected error on requesting lyrics', ex as Error);
        }
    }
}

export { LyricsService };
