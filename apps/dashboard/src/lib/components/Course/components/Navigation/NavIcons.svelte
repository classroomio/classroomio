<script>
  import TableOfContents from 'carbon-icons-svelte/lib/TableOfContents.svelte'; // overview
  import Result from 'carbon-icons-svelte/lib/Result.svelte';
  import Workspace from 'carbon-icons-svelte/lib/Workspace.svelte';
  import ListChecked from 'carbon-icons-svelte/lib/ListChecked.svelte';
  import Group from 'carbon-icons-svelte/lib/Group.svelte';
  import ApplicationWeb from 'carbon-icons-svelte/lib/ApplicationWeb.svelte';
  import Badge from 'carbon-icons-svelte/lib/Badge.svelte';
  import IbmWatsonKnowledgeCatalog from 'carbon-icons-svelte/lib/IbmWatsonKnowledgeCatalog.svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import Bullhorn from 'carbon-icons-svelte/lib/Bullhorn.svelte';
  import { NAV_IDS } from './constants';

  export let name = '';
</script>

{#if name === NAV_IDS.SECTION}
  <TableOfContents size={20} class="carbon-icon  mr-2" />
{:else if name === NAV_IDS.NEWS_FEED}
  <Bullhorn size={20} class="carbon-icon  mr-2" />
{:else if name === NAV_IDS.LESSONS}
  <IbmWatsonKnowledgeCatalog size={20} class="carbon-icon mr-2" />
{:else if name === NAV_IDS.ATTENDANCE}
  <ListChecked size={20} class="carbon-icon mr-2" />
{:else if name === NAV_IDS.SUBMISSIONS}
  <Workspace size={20} class="carbon-icon mr-2" />
{:else if name === NAV_IDS.MARKS}
  <Result size={20} class="carbon-icon mr-2" />
{:else if name === NAV_IDS.PEOPLE}
  <Group size={20} class="carbon-icon mr-2" />
{:else if name === NAV_IDS.LANDING_PAGE}
  <ApplicationWeb size={20} class="carbon-icon mr-2" />
{:else if name === NAV_IDS.CERTIFICATES}
  <Badge size={20} class="carbon-icon mr-2" />
{:else if name === NAV_IDS.SETTINGS}
  <Settings size={20} class="carbon-icon mr-2" />
{/if}
