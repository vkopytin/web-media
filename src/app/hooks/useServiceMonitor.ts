import { useEffect, useReducer } from 'react';
import { Notifications } from '../utils';

export const useServiceMonitor = <T,>(service: T): T => {
    const [, doRefresh] = useReducer(() => ({}), {});

    useEffect(() => {
        const doRefreshCallback = () => doRefresh();
        Notifications.observe(service, doRefreshCallback);
        return () => {
            Notifications.stopObserving(service, doRefreshCallback);
        };
    }, [service]);

    return service;
};
