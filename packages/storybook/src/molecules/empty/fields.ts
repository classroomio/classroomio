import { type ComponentProps } from 'svelte';
import { Empty } from '@cio/ui/base/empty';

export const FIELDS: (keyof ComponentProps<typeof Empty>)[] = ['class'];
