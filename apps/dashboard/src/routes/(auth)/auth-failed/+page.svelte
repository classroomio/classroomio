<script lang="ts">
  import { page } from '$app/state';
  import { AuthUI } from '$lib/features/ui';
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';
  import { currentOrg } from '$lib/utils/store/org';
  import Avatar from '$lib/components/Avatar/index.svelte';

  const errorCode = $derived(new URLSearchParams(page.url.search).get('error'));
</script>

<svelte:head>
  <title>Reset Password - ClassroomIO</title>
</svelte:head>

<AuthUI isLogin={false} showOnlyContent={true}>
  <div class="flex flex-col items-center gap-4">
    <Avatar
      src={$currentOrg.avatarUrl ? $currentOrg.avatarUrl : '/logo-192.png'}
      name={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
      shape="rounded-md"
      width="w-10"
      height="max-h-10"
      className="mr-2"
    />

    <p class="text-xl font-semibold">Something went wrong</p>

    {#if errorCode}
      <Card.Description class="border px-2 py-1">
        CODE: {errorCode}
      </Card.Description>
    {/if}

    <Card.Description class="text-center">
      We encountered an unexpected error. Please try again or return to the home page. If you're a developer, you can
      find more information about the error here.
    </Card.Description>

    <Button href="/" class="">Go Home</Button>
  </div>
</AuthUI>
