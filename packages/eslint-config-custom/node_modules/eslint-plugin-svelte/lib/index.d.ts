import type { RuleModule } from './types';
import * as processor from './processor';
declare const _default: {
    meta: typeof processor.meta;
    configs: {
        base: {
            plugins: string[];
            overrides: {
                files: string[];
                parser: string;
                rules: {
                    'no-inner-declarations': string;
                    'no-self-assign': string;
                    'svelte/comment-directive': string;
                    'svelte/system': string;
                };
            }[];
        };
        recommended: {
            extends: string[];
            rules: {
                'svelte/comment-directive': string;
                'svelte/no-at-debug-tags': string;
                'svelte/no-at-html-tags': string;
                'svelte/no-dupe-else-if-blocks': string;
                'svelte/no-dupe-style-properties': string;
                'svelte/no-dynamic-slot-name': string;
                'svelte/no-inner-declarations': string;
                'svelte/no-not-function-handler': string;
                'svelte/no-object-in-text-mustaches': string;
                'svelte/no-shorthand-style-property-overrides': string;
                'svelte/no-unknown-style-directive-property': string;
                'svelte/no-unused-svelte-ignore': string;
                'svelte/system': string;
                'svelte/valid-compile': string;
            };
        };
        prettier: {
            extends: string[];
            rules: {
                'svelte/first-attribute-linebreak': string;
                'svelte/html-closing-bracket-spacing': string;
                'svelte/html-quotes': string;
                'svelte/html-self-closing': string;
                'svelte/indent': string;
                'svelte/max-attributes-per-line': string;
                'svelte/mustache-spacing': string;
                'svelte/no-spaces-around-equal-signs-in-attribute': string;
                'svelte/no-trailing-spaces': string;
                'svelte/shorthand-attribute': string;
                'svelte/shorthand-directive': string;
            };
        };
        all: {
            extends: string[];
            rules: any;
        };
    };
    rules: {
        [key: string]: RuleModule;
    };
    processors: {
        '.svelte': typeof processor;
        svelte: typeof processor;
    };
};
export = _default;
