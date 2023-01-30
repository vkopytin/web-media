export interface ILyricsSearchResult {
    track: {
        text: string;
    };
    copyright: {
        notice: string;
        artist?: string;
        text: string;
    }
}

export interface ILyricsPort {
    search({ artist, song }: { artist: string; song: string; }): Promise<ILyricsSearchResult>;
}
