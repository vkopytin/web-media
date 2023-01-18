import { BehaviorSubject } from 'rxjs';
import { State } from '../utils';
import { Result } from '../utils/result';
import { TrackViewModelItem } from './trackViewModelItem';


export class AlbumsViewModel {
    errors$!: BehaviorSubject<AlbumsViewModel['errors']>;
    @State errors = [] as Result<Error, unknown>[];

    tracks$!: BehaviorSubject<AlbumsViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    selectedItem$!: BehaviorSubject<AlbumsViewModel['selectedItem']>;
    @State selectedItem: TrackViewModelItem | null = null;
}
