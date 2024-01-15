import * as react from 'react';
import { ReactElement } from 'react';

declare const Pre: ({ children, className, hasCopyCode, filename, ...props }: react.ClassAttributes<HTMLPreElement> & react.HTMLAttributes<HTMLPreElement> & {
    filename?: string | undefined;
    hasCopyCode?: boolean | undefined;
}) => ReactElement;

export { Pre };
