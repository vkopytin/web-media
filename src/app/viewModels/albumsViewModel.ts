import { ServiceResult } from "../base/serviceResult";
import { State, ValueContainer } from "../utils";
import { TrackViewModelItem } from "./trackViewModelItem";


export class AlbumsViewModel {
    errors$: ValueContainer<AlbumsViewModel['errors'], AlbumsViewModel>;
    @State errors = [] as ServiceResult<any, Error>[];

    tracks$: ValueContainer<AlbumsViewModel['tracks'], AlbumsViewModel>;
    @State tracks = [] as TrackViewModelItem[];

    selectedItem$: ValueContainer<AlbumsViewModel['selectedItem'], AlbumsViewModel>;
    @State selectedItem = null as TrackViewModelItem;
}
