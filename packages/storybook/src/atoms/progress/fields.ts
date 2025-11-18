import { type ComponentProps } from 'svelte';
import { Progress } from '@cio/ui/base/progress';

export const FIELDS: (keyof ComponentProps<typeof Progress>)[] = ['max', 'min', 'value', 'ref'];
