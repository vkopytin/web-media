import * as React from 'react';
import * as _ from 'underscore';
import { ServiceResult } from '../base/serviceResult';

type PanelType = 'home' | 'playlists' | 'profile' | 'releases' | 'search' | 'tracks';

export interface ISwitchViewProps {
    currentView: PanelType;
    onClick?(evnt): void;
}

const panels = ['home', 'playlists', 'tracks', 'search', 'releases'];

class SwitchView extends React.Component<ISwitchViewProps, {}> {
    state = {
        errors: [] as ServiceResult<any, Error>[],
        prevPanel: this.props.currentView,
        currentView: this.props.currentView,
        renderCurrent: false,
        trDone: false,
        transition: ['', '']
    };

    getSlideEffect(panelKey, nextPanelKey) {
        const aIndex = panels.indexOf(panelKey),
            bIndex = panels.indexOf(nextPanelKey);

        if (aIndex < bIndex) {
            return ['left 1', '2'];
        }
        return ['right 3', '4'];
    }

    getInitSlideEffect(panelKey, nextPanelKey) {
        const aIndex = panels.indexOf(panelKey),
            bIndex = panels.indexOf(nextPanelKey);

        if (aIndex < bIndex) {
            return [' 1', 'right 2'];
        }
        return [' 3', 'left 4'];
    }

    render() {
        const prevPanel = this.state.currentView;
        const nextPanel = this.props.currentView;
        if (prevPanel !== nextPanel) {
            setTimeout(() => {
                this.setState(this.state = {
                    ...this.state,
                    trDone: false,
                    prevPanel,
                    currentView: nextPanel,
                    transition: ['', '']
                });
            }, 300);
            setTimeout(() => {
                this.state.trDone || this.setState(this.state = {
                    ...this.state,
                    trDone: true,
                    transition: this.getSlideEffect(prevPanel, nextPanel)
                });
            }, 50);
            const currentView = _.findWhere(this.props.children as any[], { key: prevPanel }),
                nextView = _.findWhere(this.props.children as any[], { key: nextPanel });

            if (!this.state.trDone) {
                this.state.transition = this.getInitSlideEffect(prevPanel, nextPanel);
            }

            return [React.cloneElement(currentView, {
                className: [currentView.props.className, 'sliding', 'sliding-in', ...this.state.transition[0].split(' ')].join(' ')
            }),
            React.cloneElement(nextView, {
                className: [nextView.props.className, 'sliding', ...this.state.transition[1].split(' ')].join(' ')
            })];
        }

        const element = _.findWhere(this.props.children as any[], { key: this.state.currentView });

        return React.cloneElement(element, {
            ...element.props,
            ...(this.props.onClick ? { onClick: this.props.onClick } : {})
        });
    }
}

export { SwitchView };

