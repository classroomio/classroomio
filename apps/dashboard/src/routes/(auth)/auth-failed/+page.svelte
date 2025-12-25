<script lang="ts">
  import { page } from '$app/state';
  import { AuthUI } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';
  import { currentOrg } from '$lib/utils/store/org';
  import * as Avatar from '@cio/ui/base/avatar';

  const errorCode = $derived(new URLSearchParams(page.url.search).get('error'));
</script>

<svelte:head>
  <title>Reset Password - ClassroomIO</title>
</svelte:head>

<AuthUI isLogin={false} showOnlyContent={true}>
  <div class="flex flex-col items-center gap-4">
    <Avatar.Root>
      <Avatar.Image
        src={$currentOrg.avatarUrl ? $currentOrg.avatarUrl : '/logo-192.png'}
        alt={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
      />
      <Avatar.Fallback>{$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}</Avatar.Fallback>
    </Avatar.Root>

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
