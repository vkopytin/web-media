/* eslint-disable */

import { DataStorage } from '../../data/dataStorage';
import { AppService } from '../../service';
import { MediaPlayerViewModel } from '../mediaPlayerViewModel';
import { MediaService } from '../../service/mediaService';
import { PlaybackService } from '../../service/playbackService';
import { SettingsService } from '../../service/settings';
import { DataSyncService } from '../../service/dataSyncService';
import { DataService } from '../../service/dataService';
import { AppViewModel } from '../appViewModel';
import { Option } from '../../utils/option';
import { LoginService } from '../../service/loginService';
import { RemotePlaybackService } from '../../service/remotePlaybackService';
import { SpotifyMediaAdapter } from '../../adapter/spotifyMediaAdapter';
import { SpotifyRemotePlaybackAdapter } from '../../adapter/spotifyRemotePlaybackAdapter';
import { SpotifyPlaybackAdapter } from '../../adapter/spotifyPlaybackAdapter';

jest.mock('../../adapter/spotifyMediaAdapter', () => {
    return {
        SpotifyMediaAdapter: jest.fn().mockImplementation(() => {
            return {
                player: jest.fn().mockImplementation(() => Promise.resolve({
                    is_playing: true
                })),
                volume: jest.fn().mockImplementation(() => {
                    return Promise.resolve({});
                }),
                play: jest.fn().mockImplementation(() => Promise.resolve({})),
                pause: jest.fn().mockImplementation(() => Promise.resolve({})),
                previous: jest.fn().mockImplementation(() => Promise.resolve({})),
                next: jest.fn().mockImplementation(() => Promise.resolve({})),
                addTracks: jest.fn().mockImplementation(() => Promise.resolve({})),
                removeTracks: jest.fn().mockImplementation(() => Promise.resolve({})),
            };
        })
    };
});

jest.mock('../appViewModel', () => {
    return {
        AppViewModel: jest.fn().mockImplementation(() => {
            return {

            };
        })
    };
});

jest.mock('../../service/playbackService', () => {
    return {
        SpotifyPlayerService: jest.fn().mockImplementation(() => {
            return {
                resume: jest.fn().mockImplementation(() => Promise.resolve({})),
            };
        })
    };
});

DataStorage.dbType = 'inMemory';

xdescribe('Media Player View Model', () => {
    let spotifyMediaAdapter: SpotifyMediaAdapter;
    let spotifyPlaybackAdapter: SpotifyPlaybackAdapter;
    let spotifyRemotePlaybackAdapter: SpotifyRemotePlaybackAdapter;
    let vm: MediaPlayerViewModel;
    let service: AppService;
    let mockedInit: jest.SpyInstance<ReturnType<MediaPlayerViewModel['init']>>;
    let dataSync: DataSyncService;
    let media: MediaService;
    let playback: PlaybackService;
    let remotePlayback: RemotePlaybackService;
    let dataService: DataService;
    let appViewModel: AppViewModel;
    let login: LoginService;

    beforeAll(async () => {
        spotifyMediaAdapter = new SpotifyMediaAdapter('key');
        spotifyPlaybackAdapter = new SpotifyPlaybackAdapter();
        spotifyRemotePlaybackAdapter = new SpotifyRemotePlaybackAdapter('key');
        const settings = new SettingsService({ apiseeds: { key: '' }, genius: {}, lastSearch: { val: '' }, spotify: {} });
        login = new LoginService(settings);
        media = new MediaService(spotifyMediaAdapter);
        playback = new PlaybackService(spotifyPlaybackAdapter, settings);
        remotePlayback = new RemotePlaybackService(spotifyRemotePlaybackAdapter);
        dataService = new DataService();
        dataSync = new DataSyncService(dataService, media);
        service = new AppService(settings, login, dataService, media, dataSync, playback, remotePlayback);
        appViewModel = new AppViewModel(login, dataSync, media, playback, remotePlayback, service);

        mockedInit = jest.spyOn(MediaPlayerViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        Object.defineProperty(MediaPlayerViewModel.prototype, 'currentTrackId', { get() { return 'test'; }, set(v) { } });
        Object.defineProperty(MediaPlayerViewModel.prototype, 'currentTrack', { get() { return { id: 'test' }; }, set(v) { } });

        vm = new MediaPlayerViewModel(appViewModel, media, settings, playback, remotePlayback, service);
    });

    afterAll(() => {

    });

    it('Should be created', () => {
        expect(vm).toBeTruthy();
    });

    it('Should fetch data and be in isPlaying mode', async () => {
        await vm.fetchData();

        expect(vm.isPlaying).toBeTruthy();
        expect(spotifyRemotePlaybackAdapter.player).toHaveBeenCalledWith();
    });

    it('Should spotify set volume', (done) => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyRemotePlaybackAdapter.volume).toHaveBeenCalledWith(50);
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.setVolume(50);
    });

    it('Should spotify start play', (done) => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'play').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyRemotePlaybackAdapter.play).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.play();
    });

    it('Should spotify pause', (done) => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'pause').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyRemotePlaybackAdapter.pause).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.pause();
    });

    it('Should spotify previous', (done) => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'previous').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyRemotePlaybackAdapter.previous).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.previous();
    });

    it('Should spotify next', (done) => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'next').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyRemotePlaybackAdapter.next).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.next();
    });

    it('Should spotify volumeUp', (done) => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyRemotePlaybackAdapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeUp();
    });

    it('Should spotify volumeDown', (done) => {
        jest.spyOn(spotifyRemotePlaybackAdapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyRemotePlaybackAdapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeDown();
    });

    it('Should spotify likeTrack', (done) => {
        jest.spyOn(spotifyMediaAdapter, 'addTracks').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyMediaAdapter.addTracks).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.likeTrack();
    });

    it('Should spotify unlikeTrack', async () => {
        jest.spyOn(spotifyMediaAdapter, 'removeTracks').mockImplementation(() => Promise.resolve({} as any));

        await vm.unlikeTrack();

        expect(spotifyMediaAdapter.removeTracks).toHaveBeenCalled();
    });

    it('Should spotify resume', async () => {
        jest.spyOn(playback, 'resume').mockImplementation(() => Promise.resolve(Option.none()));

        await vm.resume();

        expect(playback.resume).toHaveBeenCalled();
    });

});
