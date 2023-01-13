import { SpotifyAdapter } from '../../adapter/spotify';
import { mocked } from 'ts-jest/utils';
import { DataStorage } from '../../data/dataStorage';
import { Service } from '../../service';
import { MediaPlayerViewModel } from '../mediaPlayerViewModel';

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

    beforeAll(async () => {
        srv = new Service();
        vm = new MediaPlayerViewModel({} as any, srv);
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
        expect(srv.spotifyService!.val!.adapter.player).toBeCalled();
    });

    it('Should spotify set volume', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.volume).toBeCalledWith(50);
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.setVolume(50);
    });

    it('Should spotify start play', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'play').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.play).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.play();
    });

    it('Should spotify pause', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'pause').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.pause).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.pause();
    });

    it('Should spotify previous', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'previous').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.previous).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.previous();
    });

    it('Should spotify next', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'next').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.next).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.next();
    });

    it('Should spotify volumeUp', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeUp();
    });

    it('Should spotify volumeDown', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'volume').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.volume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.volumeDown();
    });

    it('Should spotify likeTrack', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'addTracks').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.addTracks).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.likeTrack();
    });

    it('Should spotify unlikeTrack', (done) => {
        jest.spyOn(srv.spotifyService!.val!.adapter, 'removeTracks').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyService!.val!.adapter.removeTracks).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.unlikeTrack();
    });

    it('Should spotify resume', (done) => {
        jest.spyOn(srv.spotifyPlayerService!.val!, 'resume').mockImplementation(() => {
            setTimeout(() => {
                expect(srv.spotifyPlayerService!.val!.resume).toHaveBeenCalled();
                done();
            });
            return Promise.resolve({} as any);
        });
        vm.currentTrack = { id: 'test' } as any;
        vm.resume();
    });

});
