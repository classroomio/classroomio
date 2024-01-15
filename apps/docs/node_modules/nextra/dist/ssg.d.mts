import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { Components } from '@mdx-js/react/lib';

declare const SSGContext: react.Context<any>;
declare const useSSG: (key?: string) => any;
declare const DataContext: react.Context<any>;
declare const useData: (key?: string) => any;
declare function RemoteContent({ components: dynamicComponents }: {
    components?: Components;
}): react_jsx_runtime.JSX.Element;

export { DataContext, RemoteContent, SSGContext, useData, useSSG };
