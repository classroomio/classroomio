import { type ComponentProps } from 'svelte';
import { Label } from '@cio/ui/base/label';

export const FIELDS: (keyof ComponentProps<typeof Label>)[] = ['children', 'child'];
