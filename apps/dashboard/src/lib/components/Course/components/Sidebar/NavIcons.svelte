<script>
  import { Certificate } from 'carbon-icons-svelte';
  import ApplicationWeb from 'carbon-icons-svelte/lib/ApplicationWeb.svelte';
  import Badge from 'carbon-icons-svelte/lib/Badge.svelte';
  import Bullhorn from 'carbon-icons-svelte/lib/Bullhorn.svelte';
  import Group from 'carbon-icons-svelte/lib/Group.svelte';
  import IbmWatsonKnowledgeCatalog from 'carbon-icons-svelte/lib/IbmWatsonKnowledgeCatalog.svelte';
  import ListChecked from 'carbon-icons-svelte/lib/ListChecked.svelte';
  import Result from 'carbon-icons-svelte/lib/Result.svelte';
  import Settings from 'carbon-icons-svelte/lib/Settings.svelte';
  import TableOfContents from 'carbon-icons-svelte/lib/TableOfContents.svelte';
  import Workspace from 'carbon-icons-svelte/lib/Workspace.svelte';

  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import { NAV_IDS } from './constants';

  export let id = '';
</script>

{#if id === NAV_IDS.SECTION}
  <TableOfContents size={20} class="carbon-icon mr-2" style="min-width: 20px;" />
{:else if id === NAV_IDS.NEWS_FEED}
  <Bullhorn size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.LESSONS}
  <IbmWatsonKnowledgeCatalog size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.ATTENDANCE}
  <ListChecked size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.SUBMISSIONS}
  <Workspace size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.MARKS}
  <Result size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.PEOPLE}
  <Group size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.LANDING_PAGE}
  <ApplicationWeb size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.CERTIFICATES}
  <Badge size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.SETTINGS}
  <Settings size={20} class="carbon-icon mr-2" />
{:else if id === NAV_IDS.COURSES}
  <span class="carbon-icon mr-2">
    <CourseIcon />
  </span>
{:else if id === NAV_IDS.SETTINGS}
  <Certificate size={20} class="carbon-icon mr-2" />
{/if}
