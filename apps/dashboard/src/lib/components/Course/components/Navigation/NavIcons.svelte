<script lang="ts">
  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents'; // overview
  import BookCheckIcon from '@lucide/svelte/icons/book-check';
  import ListTodoIcon from '@lucide/svelte/icons/list-todo';
  import UsersIcon from '@lucide/svelte/icons/users';
  import ScreenShareIcon from '@lucide/svelte/icons/screen-share';
  import AwardIcon from '@lucide/svelte/icons/award';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
  import ChartLineIcon from '@lucide/svelte/icons/chart-line';
  import ListIcon from '@lucide/svelte/icons/list';
  import { NAV_IDS } from './constants';

  interface Props {
    name?: string;
  }

  let { name = '' }: Props = $props();
</script>

{#if name === NAV_IDS.SECTION}
  <TableOfContentsIcon size={16} />
{:else if name === NAV_IDS.NEWS_FEED}
  <MegaphoneIcon size={16} />
{:else if name === NAV_IDS.LESSONS}
  <ScrollTextIcon size={16} />
{:else if name === NAV_IDS.ATTENDANCE}
  <ListIcon size={16} />
{:else if name === NAV_IDS.SUBMISSIONS}
  <ListTodoIcon size={16} />
{:else if name === NAV_IDS.MARKS}
  <BookCheckIcon size={16} />
{:else if name === NAV_IDS.PEOPLE}
  <UsersIcon size={16} />
{:else if name === NAV_IDS.ANALYTICS}
  <ChartLineIcon size={16} />
{:else if name === NAV_IDS.LANDING_PAGE}
  <ScreenShareIcon size={16} />
{:else if name === NAV_IDS.CERTIFICATES}
  <AwardIcon size={16} />
{:else if name === NAV_IDS.SETTINGS}
  <SettingsIcon size={16} />
{/if}
