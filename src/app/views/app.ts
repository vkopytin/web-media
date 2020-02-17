import * as React from 'react';
import { template } from '../templates/app';
import { bindTo, subscribeToChange, unbindFrom, updateLayout, withEvents } from 'databindjs';
import { AppViewModel } from '../viewModels/appViewModel';


export interface IAppViewProps {

}

class AppView extends withEvents(React.Component)<IAppViewProps, {}> {
    state = {
        openLogin: false
    };
    binding = bindTo(this, () => new AppViewModel(), {
        'prop(openLogin)': 'openLogin'
    });
    
    constructor(props) {
        super(props);
        subscribeToChange(this.binding, () => {
            this.setState({
                ...this.state
            });
        });
    }

    componentDidMount() {
        updateLayout(this.binding);
    }

    componentWillUnmount() {
        unbindFrom(this.binding);
    }

    prop<K extends keyof AppView['state']>(propName: K, val?: AppView['state'][K]): AppView['state'][K] {
        if (arguments.length > 1) {
            this.state[propName] = val;
            this.trigger('change:prop(' + propName + ')');
        }

        return this.state[propName];
    }

    render() {
        return template(this);
    }
}

export { AppView };
