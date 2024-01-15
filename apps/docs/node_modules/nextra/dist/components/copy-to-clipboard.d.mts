import * as react from 'react';
import { ReactElement } from 'react';

declare const CopyToClipboard: ({ getValue, ...props }: {
    getValue: () => string;
} & react.ClassAttributes<HTMLButtonElement> & react.ButtonHTMLAttributes<HTMLButtonElement>) => ReactElement;

export { CopyToClipboard };
