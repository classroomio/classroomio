import { type ComponentProps } from 'svelte';
import { Separator } from '@cio/ui/base/separator';

export const FIELDS: (keyof ComponentProps<typeof Separator>)[] = ['orientation', 'decorative'];
