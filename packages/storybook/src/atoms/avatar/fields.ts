import { type ComponentProps } from 'svelte';
import { Avatar } from '@cio/ui/base/avatar';

export const FIELDS: (keyof ComponentProps<typeof Avatar>)[] = ['loadingStatus', 'onLoadingStatusChange', 'delayMs'];
