import { useMemo, useReducer } from 'react';
import { Notifications } from '../utils';

export const useServiceMonitor = <T,>(service: T): T => {
    const [, doRefresh] = useReducer(() => ({}), {});

    useMemo(() => {
        Notifications.observe(service, doRefresh);
        return () => {
            Notifications.stopObserving(service, doRefresh);
        };
    }, [service]);

    return service;
};
