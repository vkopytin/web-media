import { SpotifyAdapter } from '../../adapter/spotify';
import { DataStorage } from '../../data/dataStorage';
import { Service } from '../../service';
import { MediaPlayerViewModel } from '../mediaPlayerViewModel';
import { SpotifyService } from '../../service/spotify';
import { SpotifyPlayerService } from '../../service/spotifyPlayer';
import { SettingsService } from '../../service/settings';
import { SpotifySyncService } from '../../service/spotifySyncService';
import { DataService } from '../../service/dataService';
import { AppViewModel } from '../appViewModel';
import { Option } from '../../utils/option';
import { LoginService } from '../../service/loginService';

jest.mock('../../adapter/spotify', () => {
    return {
        SpotifyAdapter: jest.fn().mockImplementation(() => {
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

jest.mock('../../service/spotifyPlayer', () => {
    return {
        SpotifyPlayerService: jest.fn().mockImplementation(() => {
            return {
                resume: jest.fn().mockImplementation(() => Promise.resolve({})),
            };
        })
    };
});

DataStorage.dbType = 'inMemory';

describe('Media Player View Model', () => {
    let adapter: SpotifyAdapter;
    let vm: MediaPlayerViewModel;
    let service: Service;
    let mockedInit: jest.SpyInstance<ReturnType<MediaPlayerViewModel['init']>>;
    let spotifySync: SpotifySyncService;
    let spotify: SpotifyService;
    let spotifyPlayer: SpotifyPlayerService;
    let dataService: DataService;
    let appViewModel: AppViewModel;
    let login: LoginService;

    beforeAll(async () => {
        adapter = new SpotifyAdapter('key');
        const settings = new SettingsService({ apiseeds: { key: '' }, genius: {}, lastSearch: { val: '' }, spotify: {} });
        login = new LoginService(settings);
        spotify = new SpotifyService(adapter);
        spotifyPlayer = new SpotifyPlayerService(settings);
        dataService = new DataService();
        spotifySync = new SpotifySyncService(spotify, dataService);
        service = new Service(settings, login, {} as any, dataService, spotify, spotifySync, spotifyPlayer);
        appViewModel = new AppViewModel(spotifySync, spotify, spotifyPlayer, service);

        mockedInit = jest.spyOn(MediaPlayerViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        Object.defineProperty(MediaPlayerViewModel.prototype, 'currentTrackId', { get() { return 'test'; }, set(v) { } });
        Object.defineProperty(MediaPlayerViewModel.prototype, 'currentTrack', { get() { return { id: 'test' }; }, set(v) { } });

        vm = new MediaPlayerViewModel(appViewModel, spotify, settings, spotifyPlayer, service);
    });

    afterAll(() => {

    });

    it('Should be created', () => {
        expect(vm).toBeTruthy();
    });

    it('Should fetch data and be in isPlaying mode', async () => {
        await vm.fetchDataInternal();

        expect(vm.isPlaying).toBeTruthy();
        expect(adapter.player).toHaveBeenCalledWith();
    });

    it('Should spotify set volume', (done) => {
        jest.spyOn(adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.volume).toHaveBeenCalledWith(50);
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.setVolume(50);
    });

    it('Should spotify start play', (done) => {
        jest.spyOn(adapter, 'play').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.play).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.play();
    });

    it('Should spotify pause', (done) => {
        jest.spyOn(adapter, 'pause').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.pause).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.pause();
    });

    it('Should spotify previous', (done) => {
        jest.spyOn(adapter, 'previous').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.previous).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.previous();
    });

    it('Should spotify next', (done) => {
        jest.spyOn(adapter, 'next').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.next).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.next();
    });

    it('Should spotify volumeUp', (done) => {
        jest.spyOn(adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeUp();
    });

    it('Should spotify volumeDown', (done) => {
        jest.spyOn(adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeDown();
    });

    it('Should spotify likeTrack', (done) => {
        jest.spyOn(adapter, 'addTracks').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.addTracks).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.likeTrack();
    });

    it('Should spotify unlikeTrack', async () => {
        jest.spyOn(adapter, 'removeTracks').mockImplementation(() => Promise.resolve({} as any));

        await vm.unlikeTrack();

        expect(adapter.removeTracks).toHaveBeenCalled();
    });

    it('Should spotify resume', async () => {
        jest.spyOn(spotifyPlayer, 'resume').mockImplementation(() => Promise.resolve(Option.none()));

        await vm.resume();

        expect(spotifyPlayer.resume).toHaveBeenCalled();
    });

});
