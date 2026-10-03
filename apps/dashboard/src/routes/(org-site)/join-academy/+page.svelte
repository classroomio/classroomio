<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { Avatar, AvatarFallback, AvatarImage } from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';
  import { Card } from '@cio/ui/base/card';
  import { EmptyDescription, EmptyTitle } from '@cio/ui/base/empty';
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cio/ui/base/collapsible';
  import { Spinner } from '@cio/ui/base/spinner';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  let { data } = $props();

  let hasFailed = $state(false);

  const isLimitReached = $derived(orgApi.joinErrorCode === 'UPGRADE_REQUIRED');

  async function joinAcademy() {
    const orgId = $currentOrg.id || data.org?.id;
    if (!orgId) {
      hasFailed = true;
      return;
    }

    hasFailed = false;
    const redirectTo = page.url.searchParams.get('redirect') || '/lms';
    const result = await orgApi.joinAcademy(orgId, redirectTo);
    if (!result) {
      hasFailed = true;
    }
  }

  onMount(() => {
    void joinAcademy();
  });
</script>

<main class="flex min-h-screen items-center justify-center p-6">
  {#if hasFailed && isLimitReached}
    <Card class="w-full max-w-md gap-5 p-8">
      <div class="flex flex-col items-center gap-3 text-center">
        <Avatar class="size-11 rounded-xl">
          <AvatarImage src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
          <AvatarFallback class="rounded-xl">{$currentOrg.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span class="ui:text-muted-foreground text-sm">{$currentOrg.name}</span>
        <EmptyTitle>{$t('invite.organization.limit_reached.title')}</EmptyTitle>
        <EmptyDescription>
          {$t('invite.organization.limit_reached.description', { orgName: $currentOrg.name })}
        </EmptyDescription>
      </div>

      <div class="flex gap-3">
        <Button class="flex-1" variant="secondary" href="/">{$t('navigation.home')}</Button>
        <Button class="flex-1" onclick={joinAcademy}>{$t('invite.organization.messages.try_again')}</Button>
      </div>

      <Collapsible>
        <CollapsibleTrigger class="ui:text-muted-foreground flex items-center gap-1.5 text-sm">
          <ChevronDownIcon class="size-4" />
          {$t('invite.organization.limit_reached.technical_details')}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl class="ui:bg-muted mt-3 grid grid-cols-[auto_1fr] gap-x-3 rounded-md p-3 text-xs">
            <dt class="ui:text-muted-foreground">{$t('invite.organization.limit_reached.error_code')}</dt>
            <dd class="font-mono">{orgApi.joinErrorCode}</dd>
          </dl>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  {:else if hasFailed}
    <div class="flex max-w-md flex-col items-center gap-4 text-center">
      <p class="ui:text-destructive">{$t('invite.organization.messages.join_failed')}</p>
      <div class="flex gap-3">
        <Button variant="secondary" href="/">{$t('navigation.home')}</Button>
        <Button onclick={joinAcademy}>{$t('invite.organization.messages.try_again')}</Button>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4 text-center">
      <Spinner class="size-10!" />
      <p class="ui:text-muted-foreground">{$t('navigation.loading_state')}</p>
    </div>
  {/if}
</main>
