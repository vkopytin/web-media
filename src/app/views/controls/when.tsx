import React from 'react';

export const When = (props: { itIs: unknown, children: React.ReactNode }) => {
    if (props.itIs) {
        return <>{props.children}</>;
    }
    return <></>;
};
