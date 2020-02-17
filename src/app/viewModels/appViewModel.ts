import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';



class AppViewModel extends Events {

    settings = {
        openLogin: false
    };

    constructor(private ss = new Service()) {
        super();

        (async function (this: AppViewModel) {
            const isLoggedIn = await this.ss.isLoggedIn();
            this.openLogin(!isLoggedIn);
        }).call(this);
    }

    openLogin(val?) {
        if (arguments.length) {
            this.settings.openLogin = !!val;
            this.trigger('change:openLogin');
        }

        return this.settings.openLogin;
    }
}

export { AppViewModel };
