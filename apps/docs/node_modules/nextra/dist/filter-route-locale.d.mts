import { a as PageMapItem } from './types-c8e621b7.js';
import '@mdx-js/mdx';
import 'gray-matter';
import 'mdast';
import 'next';
import 'react';
import 'rehype-pretty-code';

declare function filterRouteLocale(pageMap: PageMapItem[], locale: string, defaultLocale: string): PageMapItem[];

export { filterRouteLocale as default };
