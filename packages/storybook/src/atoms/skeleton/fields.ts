import { type ComponentProps } from 'svelte';
import { Skeleton } from '@cio/ui/base/skeleton';

export const FIELDS: (keyof ComponentProps<typeof Skeleton>)[] = ['class'];
