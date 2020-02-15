import { RMService } from '../service';
import { Home } from './home';
import { Info } from './info';


class ControllerFactory {
    static create<T>(controllerCtor: new () => T, req, res): T {
        switch (controllerCtor) {
            case Home as any:
                return new Home(req, res, RMService.create(req)) as any;
                break;
            default:
                return new Info(req, res) as any;
        }
    }
}

export { ControllerFactory };
