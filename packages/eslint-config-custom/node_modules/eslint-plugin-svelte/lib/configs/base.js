"use strict";
module.exports = {
    plugins: ['svelte'],
    overrides: [
        {
            files: ['*.svelte'],
            parser: require.resolve('svelte-eslint-parser'),
            rules: {
                'no-inner-declarations': 'off',
                'no-self-assign': 'off',
                'svelte/comment-directive': 'error',
                'svelte/system': 'error'
            }
        }
    ]
};
