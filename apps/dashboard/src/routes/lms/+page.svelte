<script lang="ts">
  import { DashboardPage } from '$features/lms/pages';
  import { getGreeting } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Student Dashboard - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t(getGreeting())}
        {$profile.fullname}!
      </Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <DashboardPage />
    {/snippet}
  </Page.Body>
</Page.Root>
