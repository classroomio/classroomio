import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactElement, ReactNode } from 'react';

declare const TypeToEmoji: {
    default: string;
    error: string;
    info: react_jsx_runtime.JSX.Element;
    warning: string;
};
type CalloutType = keyof typeof TypeToEmoji;
type CalloutProps = {
    type?: CalloutType;
    emoji?: string | ReactNode;
    children: ReactNode;
};
declare function Callout({ children, type, emoji }: CalloutProps): ReactElement;

export { Callout };
