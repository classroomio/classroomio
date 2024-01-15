import { ComponentProps, ReactElement } from 'react';

declare function ExpandIcon({ isOpen, ...props }: {
    isOpen?: boolean;
} & ComponentProps<'svg'>): ReactElement;

export { ExpandIcon };
