import { BehaviorSubject } from "rxjs";
import { ServiceResult } from "../base/serviceResult";
import { State } from "../utils";
import { TrackViewModelItem } from "./trackViewModelItem";


export class AlbumsViewModel {
    errors$: BehaviorSubject<AlbumsViewModel['errors']>;
    @State errors = [] as ServiceResult<any, Error>[];

    tracks$: BehaviorSubject<AlbumsViewModel['tracks']>;
    @State tracks = [] as TrackViewModelItem[];

    selectedItem$: BehaviorSubject<AlbumsViewModel['selectedItem']>;
    @State selectedItem = null as TrackViewModelItem;
}
