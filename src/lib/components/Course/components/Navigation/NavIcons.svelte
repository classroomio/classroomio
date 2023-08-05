<script>
  import TableOfContents from 'carbon-icons-svelte/lib/TableOfContents.svelte'; // overview
  import Result from 'carbon-icons-svelte/lib/Result.svelte';
  import Workspace from 'carbon-icons-svelte/lib/Workspace.svelte';
  import ListChecked from 'carbon-icons-svelte/lib/ListChecked.svelte';
  import Group from 'carbon-icons-svelte/lib/Group.svelte';
  import ApplicationWeb from 'carbon-icons-svelte/lib/ApplicationWeb.svelte';
  import Badge from 'carbon-icons-svelte/lib/Badge.svelte';
  import IbmWatsonKnowledgeCatalog from 'carbon-icons-svelte/lib/IbmWatsonKnowledgeCatalog.svelte';

  export let name = '';
</script>

{#if name === 'Overview'}
  <TableOfContents size={20} class="carbon-icon dark:text-white mr-2" />
{:else if name === 'Lessons'}
  <IbmWatsonKnowledgeCatalog size={20} class="carbon-icon dark:text-white mr-2" />
{:else if name === 'Attendance'}
  <ListChecked size={20} class="carbon-icon dark:text-white mr-2" />
{:else if name === 'Submissions'}
  <Workspace size={20} class="carbon-icon dark:text-white mr-2" />
{:else if name === 'Marks'}
  <Result size={20} class="carbon-icon dark:text-white mr-2" />
{:else if name === 'People'}
  <Group size={20} class="carbon-icon dark:text-white mr-2" />
{:else if name === 'Landing Page'}
  <ApplicationWeb size={20} class="carbon-icon dark:text-white mr-2" />
{:else if name === 'Certificates'}
  <Badge size={20} class="carbon-icon dark:text-white mr-2" />
{/if}
