import { Events } from 'databindjs';
import { Service, SpotifyService } from '../service';



const panels = ['home', 'profile'];

class AppViewModel extends Events {

    settings = {
        openLogin: false,
        currentPanel: 'home' as 'home' | 'profile'
    };

    constructor(private ss = new Service()) {
        super();

        (async function (this: AppViewModel) {
            const isLoggedInResult = await this.ss.isLoggedIn();

            if (isLoggedInResult.error) {
                this.openLogin(true);
            }

            this.openLogin(!isLoggedInResult.val);
        }).call(this);
    }

    openLogin(val?) {
        if (arguments.length) {
            this.settings.openLogin = !!val;
            this.trigger('change:openLogin');
        }

        return this.settings.openLogin;
    }

    currentPanel(val?) {
        if (arguments.length) {
            this.settings.currentPanel = val;
            this.trigger('change:currentPanel');
        }

        return this.settings.currentPanel;
    }
}

export { AppViewModel };
