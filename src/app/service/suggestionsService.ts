import { IMediaPort } from '../ports/iMediaProt';
import { State } from '../utils';
import { TrackViewModelItem } from '../viewModels/trackViewModelItem';

export class SuggestionsService {
    @State tracks: TrackViewModelItem[] = [];

    constructor(media: IMediaPort) {

    }
}
