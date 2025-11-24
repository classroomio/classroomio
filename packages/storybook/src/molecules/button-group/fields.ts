import { type ComponentProps } from 'svelte';
import { ButtonGroup } from '@cio/ui/base/button-group';

export const FIELDS: (keyof ComponentProps<typeof ButtonGroup>)[] = ['class', 'orientation'];
