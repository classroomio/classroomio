import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode, ComponentProps } from 'react';

declare function Card({ children, title, icon, image, arrow, href, ...props }: {
    children: ReactNode;
    title: string;
    icon: ReactNode;
    image?: boolean;
    arrow?: boolean;
    href: string;
}): react_jsx_runtime.JSX.Element;
declare function _Cards({ children, num, className, style, ...props }: {
    num?: number;
} & ComponentProps<'div'>): react_jsx_runtime.JSX.Element;
declare const Cards: typeof _Cards & {
    displayName: string;
    Card: typeof Card;
};

export { Card, Cards };
