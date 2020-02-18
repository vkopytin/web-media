import { Events } from 'databindjs';
import { Service } from '../service';



class ProfileViewModel extends Events {

    settings = {
        openLogin: false
    };

    constructor(private ss = new Service()) {
        super();
    }

}

export { ProfileViewModel };
