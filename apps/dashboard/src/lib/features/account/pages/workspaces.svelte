<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Field from '@cio/ui/base/field';

  import { accountApi } from '$features/account/api/account.svelte';
  import { currentOrg, isPrimaryWorkspace } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  let isCreateOpen = $state(false);
  let formName = $state('');
  let formSiteName = $state('');
  let confirmDeleteId = $state<string | null>(null);

  $effect(() => {
    if (!$currentOrg.id) return;

    accountApi.listWorkspaces();
    accountApi.loadUsage();
  });

  const limits = $derived(accountApi.limits);
  const usage = $derived(accountApi.usage);
  const workspaces = $derived(accountApi.workspaces);

  const ctaState = $derived.by(() => {
    if (!limits) return { kind: 'loading' as const };

    if (limits.requiresUpgrade) {
      return { kind: 'upgrade' as const };
    }

    if (!limits.canCreate) {
      return { kind: 'limit' as const, allowance: limits.allowance };
    }

    return { kind: 'create' as const, used: limits.used, allowance: limits.allowance };
  });

  async function onCreate() {
    await accountApi.createWorkspace({ name: formName, siteName: formSiteName });

    if (accountApi.success) {
      formName = '';
      formSiteName = '';
      isCreateOpen = false;
    }
  }

  async function onDelete(id: string) {
    await accountApi.deleteWorkspace(id);
    confirmDeleteId = null;
  }
</script>

{#if !$isPrimaryWorkspace}
  <div class="ui:text-muted-foreground rounded border p-4">
    {$t('account.workspaces.secondary_billing_notice', { primaryName: $currentOrg.name })}
  </div>
{:else}
  <Field.Group class="w-full max-w-2xl px-2">
    {#if usage}
      <Field.Set>
        <div class="rounded border p-4">
          <p class="text-sm">
            {$t('account.workspaces.usage_banner', {
              learners: usage.learnerCount,
              tokens: usage.tokensUsedThisMonth,
              workspaces: usage.workspaceCount
            })}
          </p>
        </div>
      </Field.Set>
      <Field.Separator />
    {/if}

    <Field.Set>
      <div class="flex items-center justify-between">
        <Field.Legend>{$t('account.workspaces.page_title')}</Field.Legend>

        {#if ctaState.kind === 'create'}
          <Button onclick={() => (isCreateOpen = true)}>
            {$t('account.workspaces.create_cta')}
            <span class="ui:text-muted-foreground ml-2">
              {$t('account.workspaces.create_cta_used', { used: ctaState.used, allowance: ctaState.allowance })}
            </span>
          </Button>
        {:else if ctaState.kind === 'limit'}
          <Button disabled variant="outline">
            {$t('account.workspaces.create_cta_disabled_limit', { allowance: ctaState.allowance })}
          </Button>
        {:else if ctaState.kind === 'upgrade'}
          <Button variant="outline" href="/pricing">
            {$t('account.workspaces.create_cta_disabled_upgrade')}
            <span class="ml-2 underline">{$t('account.workspaces.upgrade_link')}</span>
          </Button>
        {/if}
      </div>

      <Field.Group>
        {#if accountApi.isLoading && workspaces.length === 0}
          <Spinner class="size-10! text-blue-700!" />
        {:else}
          {#each workspaces as workspace}
            <Field.Field>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <p class="text-sm font-medium">{workspace.name}</p>
                  <span class="ui:text-muted-foreground text-xs">{workspace.siteName}</span>
                  {#if workspace.isPrimary}
                    <Badge variant="secondary">{$t('account.workspaces.primary_badge')}</Badge>
                  {/if}
                  {#if workspace.readOnlyUntil}
                    <Badge variant="outline" class="text-yellow-700">{$t('account.workspaces.read_only_badge')}</Badge>
                  {/if}
                </div>

                {#if !workspace.isPrimary}
                  <Button
                    variant="ghost"
                    class="text-red-500 hover:text-red-700"
                    onclick={() => (confirmDeleteId = workspace.id)}
                  >
                    {$t('account.workspaces.delete_action')}
                  </Button>
                {/if}
              </div>
            </Field.Field>
          {/each}
        {/if}
      </Field.Group>
    </Field.Set>
  </Field.Group>
{/if}

<Dialog.Root bind:open={isCreateOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('account.workspaces.create_modal_title')}</Dialog.Title>
    </Dialog.Header>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('account.workspaces.name_label')}</Field.Label>
        <Input bind:value={formName} />
        {#if accountApi.errors.name}
          <Field.Error>{accountApi.errors.name}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('account.workspaces.site_name_label')}</Field.Label>
        <Input bind:value={formSiteName} />
        {#if accountApi.errors.siteName}
          <Field.Error>{accountApi.errors.siteName}</Field.Error>
        {/if}
      </Field.Field>
    </Field.Group>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isCreateOpen = false)}>{$t('account.workspaces.cancel')}</Button>
      <Button onclick={onCreate} loading={accountApi.isLoading} disabled={accountApi.isLoading}>
        {$t('account.workspaces.create_modal_submit')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root open={confirmDeleteId !== null} onOpenChange={(open) => !open && (confirmDeleteId = null)}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('account.workspaces.delete_confirm_title')}</Dialog.Title>
    </Dialog.Header>
    <p class="ui:text-muted-foreground">{$t('account.workspaces.delete_confirm_body')}</p>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (confirmDeleteId = null)}>{$t('account.workspaces.cancel')}</Button>
      <Button
        variant="destructive"
        onclick={() => confirmDeleteId && onDelete(confirmDeleteId)}
        loading={accountApi.isLoading}
        disabled={accountApi.isLoading}
      >
        {$t('account.workspaces.delete_action')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
