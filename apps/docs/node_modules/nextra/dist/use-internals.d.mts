import { a as PageOpts } from './types-2e9b0ab5.js';
import * as react from 'react';
import 'gray-matter';
import 'mdast';

/**
 * This hook is used to access the internal state of Nextra, you should never
 * use this hook in your application.
 */
declare function useInternals(): {
    context: {
        Content: react.FC;
        pageOpts: PageOpts<{
            [key: string]: any;
        }>;
        themeConfig: any;
    };
    Layout: react.FC<any>;
};

export { useInternals };
