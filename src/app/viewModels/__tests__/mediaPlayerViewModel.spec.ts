import { SpotifyAdapter } from '../../adapter/spotify';
import { mocked } from 'ts-jest/utils';
import { DataStorage } from '../../data/dataStorage';
import { Service } from '../../service';
import { MediaPlayerViewModel } from '../mediaPlayerViewModel';
import { SpotifyService } from '../../service/spotify';
import { SpotifyPlayerService } from '../../service/spotifyPlayer';
import { SettingsService } from '../../service/settings';

let mockSrv: any;

jest.mock('../../adapter/spotify', () => {
    return {
        SpotifyAdapter: jest.fn().mockImplementation(() => {
            return mockSrv = mockSrv || {
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
    const MockedSpotifyAdapter = mocked(SpotifyAdapter, true);
    let vm: MediaPlayerViewModel;
    let srv: Service;
    let spotifyService: SpotifyService;
    let spotifyPlayerService: SpotifyPlayerService;

    beforeAll(async () => {
        spotifyService = new SpotifyService(new SpotifyAdapter('test'));
        spotifyPlayerService = new SpotifyPlayerService(new SettingsService());
        srv = new Service({} as any, {} as any, {} as any, {} as any, spotifyService, {} as any, spotifyPlayerService);
        vm = new MediaPlayerViewModel({} as any, {} as any, {} as any, {} as any, srv);
        const res = await vm.isInit;
        expect(res).toBeTruthy();
    });

    afterAll(() => {
        MockedSpotifyAdapter.mockClear();
    });

    it('Should be created', () => {
        expect(vm).toBeTruthy();
    });

    it('Should fetch data and be in isPlaying mode', async () => {
        await vm.fetchDataInternal();

        expect(vm.isPlaying).toBeTruthy();
        expect(spotifyService.adapter.player).toBeCalled();
    });

    it('Should spotify set volume', (done) => {
        jest.spyOn(spotifyService.adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.volume).toBeCalledWith(50);
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.setVolume(50);
    });

    it('Should spotify start play', (done) => {
        jest.spyOn(spotifyService.adapter, 'play').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.play).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.play();
    });

    it('Should spotify pause', (done) => {
        jest.spyOn(spotifyService.adapter, 'pause').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.pause).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.pause();
    });

    it('Should spotify previous', (done) => {
        jest.spyOn(spotifyService.adapter, 'previous').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.previous).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.previous();
    });

    it('Should spotify next', (done) => {
        jest.spyOn(spotifyService.adapter, 'next').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.next).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.next();
    });

    it('Should spotify volumeUp', (done) => {
        jest.spyOn(spotifyService!.adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeUp();
    });

    it('Should spotify volumeDown', (done) => {
        jest.spyOn(spotifyService.adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeDown();
    });

    it('Should spotify likeTrack', (done) => {
        jest.spyOn(spotifyService.adapter, 'addTracks').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.addTracks).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.likeTrack();
    });

    it('Should spotify unlikeTrack', (done) => {
        jest.spyOn(spotifyService.adapter, 'removeTracks').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyService.adapter.removeTracks).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.unlikeTrack();
    });

    it('Should spotify resume', (done) => {
        jest.spyOn(spotifyPlayerService, 'resume').mockImplementation(() => {
            setTimeout(() => {
                expect(spotifyPlayerService.resume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.resume();
    });

});
