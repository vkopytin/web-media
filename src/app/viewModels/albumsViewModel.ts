import { LogService } from '../service';
import { Binding, State } from '../utils';
import { Result } from '../utils/result';
import { TrackViewModelItem } from './trackViewModelItem';


export class AlbumsViewModel {
    @State selectedItem: TrackViewModelItem | null = null;
    @State tracks: TrackViewModelItem[] = [];

    @Binding((v: AlbumsViewModel) => v.logService, 'errors')
    errors!: Result[];

    constructor(
        private logService: LogService,
    ) {

    }
}
