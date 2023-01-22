import { State } from '../utils';
import { Result } from '../utils/result';
import { TrackViewModelItem } from './trackViewModelItem';


export class AlbumsViewModel {
    @State selectedItem: TrackViewModelItem | null = null;
    @State errors: Result[] = [];
    @State tracks: TrackViewModelItem[] = [];
}
