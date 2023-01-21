import { BehaviorSubject } from 'rxjs';
import { State } from '../utils';
import { Result } from '../utils/result';
import { TrackViewModelItem } from './trackViewModelItem';


export class AlbumsViewModel {
    @State errors = [] as Result<Error, unknown>[];
    @State tracks = [] as TrackViewModelItem[];
    @State selectedItem: TrackViewModelItem | null = null;
}
