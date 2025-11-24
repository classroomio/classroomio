import { type ComponentProps } from 'svelte';
import { Page } from '@cio/ui/base/page';

export const FIELDS: (keyof ComponentProps<typeof Page>)[] = ['class'];

