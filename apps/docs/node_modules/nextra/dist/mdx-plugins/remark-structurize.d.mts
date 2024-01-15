import { Root } from 'mdast';
import { Plugin } from 'unified';
import { d as Flexsearch } from '../types-c8e621b7.js';
import '@mdx-js/mdx';
import 'gray-matter';
import 'next';
import 'react';
import 'rehype-pretty-code';

declare const remarkStructurize: Plugin<[Flexsearch], Root>;

export { remarkStructurize };
