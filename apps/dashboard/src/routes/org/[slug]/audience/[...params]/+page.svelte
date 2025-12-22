<script lang="ts">
  import { UserAnalyticsPage } from '$features/audience/pages';
  import * as Page from '@cio/ui/base/page';

  let { data } = $props();
</script>

<svelte:head>
  <title>User Analytics - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-5xl lg:mx-auto">
  <Page.Body>
    {#snippet child()}
      <UserAnalyticsPage {data} />
    {/snippet}
  </Page.Body>
</Page.Root>
