import { type ComponentProps } from 'svelte';
import { Pagination } from '@cio/ui/base/pagination';

export const FIELDS: (keyof ComponentProps<typeof Pagination>)[] = [
  'count',
  'page',
  'onPageChange',
  'perPage',
  'orientation'
];
