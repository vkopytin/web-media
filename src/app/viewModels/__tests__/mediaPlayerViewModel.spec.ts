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
})

DataStorage.dbType = 'inMemory';

window.Spotify = {
    Player: (function () {
        function Player() {

        }
        Player.prototype = {
            addListener: jest.fn().mockImplementation(() => Promise.resolve(true)),
            connect: jest.fn().mockImplementation(() => Promise.resolve(true)),
            getCurrentState: jest.fn().mockImplementation(() => Promise.resolve({} as any)),
        };

        return Player;
    })()
} as any;

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

    beforeAll(async () => {
        adapter = new SpotifyAdapter('key');
        const settings = new SettingsService({ apiseeds: { key: '' }, genius: {}, lastSearch: { val: '' }, spotify: {} });
        spotify = new SpotifyService(adapter);
        spotifyPlayer = new SpotifyPlayerService(settings);
        dataService = new DataService();
        spotifySync = new SpotifySyncService(spotify, dataService);
        appViewModel = new AppViewModel(spotifySync, spotify, spotifyPlayer, service);
        mockedInit = jest.spyOn(MediaPlayerViewModel.prototype, 'init').mockImplementation(() => Promise.resolve());
        vm = new MediaPlayerViewModel({} as any, {} as any, {} as any, {} as any, service);
    });

    afterAll(() => {

    });

    it('Should be created', () => {
        expect(vm).toBeTruthy();
    });

    it('Should fetch data and be in isPlaying mode', async () => {
        await vm.fetchDataInternal();

        expect(vm.isPlaying).toBeTruthy();
        expect(adapter.player).toBeCalled();
    });

    it('Should spotify set volume', (done) => {
        jest.spyOn(adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.volume).toBeCalledWith(50);
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

    it('Should spotify unlikeTrack', (done) => {
        jest.spyOn(adapter, 'removeTracks').mockImplementation(() => {
            setTimeout(() => {
                expect(adapter.removeTracks).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.unlikeTrack();
    });

    it('Should spotify resume', (done) => {
        jest.spyOn(spotifyPlayer, 'resume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyPlayer.resume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.resume();
    });

});
