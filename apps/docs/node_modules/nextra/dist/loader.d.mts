import { LoaderContext } from 'webpack';
import { L as LoaderOptions } from './types-c8e621b7.js';
import '@mdx-js/mdx';
import 'gray-matter';
import 'mdast';
import 'next';
import 'react';
import 'rehype-pretty-code';

declare function syncLoader(this: LoaderContext<LoaderOptions>, source: string, callback: (err?: null | Error, content?: string | Buffer) => void): void;

export { syncLoader as default };
