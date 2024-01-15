import { P as Page } from './types-c8e621b7.js';
import '@mdx-js/mdx';
import 'gray-matter';
import 'mdast';
import 'next';
import 'react';
import 'rehype-pretty-code';

declare function getAllPages(): Page[];
declare function getCurrentLevelPages(): Page[];
declare function getPagesUnderRoute(route: string): Page[];

export { getAllPages, getCurrentLevelPages, getPagesUnderRoute };
