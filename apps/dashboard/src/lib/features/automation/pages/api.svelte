<script lang="ts">
  import { automationApi } from '$features/automation/api/automation.svelte';
  import {
    getMaskedAutomationSecret,
    getPublicApiCurlSnippet,
    getPublicApiGoSnippet,
    getPublicApiJavaScriptSnippet,
    getPublicApiPythonSnippet
  } from '$features/automation/utils/automation-utils';
  import { hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import * as Alert from '@cio/ui/base/alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Code from '@cio/ui/custom/code';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Field from '@cio/ui/base/field';
  import * as Table from '@cio/ui/base/table';
  import * as Tabs from '@cio/ui/base/tabs';
  import { InputField } from '@cio/ui/custom/input-field';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { UpgradeBanner } from '$features/ui';
  import CodeIcon from '@lucide/svelte/icons/code';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import KeyIcon from '@lucide/svelte/icons/key';
  import PlusIcon from '@lucide/svelte/icons/plus';

  let activeSetupTab = $state('curl');
  let generatedSecret = $state<string | null>(null);
  let isCreateKeyModalOpen = $state(false);
  let keyLabel = $state('');

  const canCreateKey = $derived(keyLabel.trim().length > 0 && !automationApi.isLoading);
  const upgradeMessageKey = $derived(
    PUBLIC_IS_SELFHOSTED === 'true' ? 'upgrade.enterprise_required' : 'upgrade.public_api_required'
  );

  function resetCreateKeyModal() {
    keyLabel = '';
    automationApi.resetErrors();
  }

  function openCreateKeyModal() {
    if (!$hasPublicApiAccess) {
      snackbar.error(upgradeMessageKey);
      return;
    }
    resetCreateKeyModal();
    isCreateKeyModalOpen = true;
  }

  async function onGenerateKey() {
    if (!$hasPublicApiAccess) return;
    const result = await automationApi.createKey('api', keyLabel);
    if (!result) return;

    generatedSecret = automationApi.generatedSecret;
    automationApi.clearGeneratedSecret();
    isCreateKeyModalOpen = false;
    resetCreateKeyModal();
  }

  async function onRevokeKey(keyId: string) {
    if (!$hasPublicApiAccess) return;
    if (!confirm(t.get('automation.keys.revoke_confirm'))) return;
    await automationApi.revokeKey(keyId);
  }

  async function onRotateKey(keyId: string) {
    if (!$hasPublicApiAccess) return;
    if (!confirm(t.get('automation.keys.rotate_confirm'))) return;
    await automationApi.rotateKey(keyId);
    generatedSecret = automationApi.generatedSecret;
    automationApi.clearGeneratedSecret();
  }

  const apiKeys = $derived(automationApi.keys.filter((key) => key.type === 'api'));
  const hasActiveApiKey = $derived(apiKeys.some((key) => !key.revokedAt));
</script>

<Field.Group class="mx-auto w-full space-y-2">
  <UpgradeBanner visible={!$hasPublicApiAccess}>{$t(upgradeMessageKey)}</UpgradeBanner>

  {#if !$isOrgAdmin}
    <Alert.Callout
      variant="information"
      title={$t('automation.permissions.disabled_title')}
      description={$t('automation.permissions.disabled_description')}
      class="w-full"
    />
  {/if}

  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 font-medium">
        <KeyIcon class="size-5" />
        {$t('automation.api.keys.title')}
      </div>
      {#if $isOrgAdmin}
        <IconButton
          onclick={openCreateKeyModal}
          disabled={automationApi.isLoading || !$hasPublicApiAccess}
          tooltip={$t('automation.api.keys.generate')}
        >
          <PlusIcon size={16} />
        </IconButton>
      {/if}
    </div>
    <p class="ui:text-muted-foreground text-sm">{$t('automation.api.keys.description')}</p>

    {#if generatedSecret}
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p class="ui:text-amber-800 text-sm font-medium">{$t('automation.api.keys.secret_once')}</p>
        <div class="mt-3">
          <Code.Root code={generatedSecret} hideLines={true} class="ui:break-all ui:text-xs">
            <Code.CopyButton />
          </Code.Root>
        </div>
      </div>
    {/if}

    {#if $isOrgAdmin}
      {#if apiKeys.length > 0}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>{$t('automation.keys.table_key')}</Table.Head>
              <Table.Head>{$t('automation.keys.table_status')}</Table.Head>
              <Table.Head>{$t('automation.keys.table_created')}</Table.Head>
              <Table.Head>{$t('automation.keys.table_last_used')}</Table.Head>
              <Table.Head class="w-10"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each apiKeys as key (key.id)}
              <Table.Row>
                <Table.Cell>
                  <div>
                    <p class="font-medium">{key.label}</p>
                    <p class="ui:text-muted-foreground text-xs">
                      {getMaskedAutomationSecret(key.secretPrefix)}
                    </p>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={key.revokedAt ? 'secondary' : 'default'}>
                    {key.revokedAt ? $t('automation.keys.revoked') : $t('automation.keys.active')}
                  </Badge>
                </Table.Cell>
                <Table.Cell class="ui:text-muted-foreground text-sm">
                  {new Date(key.createdAt).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell class="ui:text-muted-foreground text-sm">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : $t('automation.keys.never_used')}
                </Table.Cell>
                <Table.Cell>
                  {#if !key.revokedAt}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger class="inline-flex items-center justify-center">
                        <IconButton aria-label="actions">
                          <EllipsisVerticalIcon size={16} />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        <DropdownMenu.Item onclick={() => onRotateKey(key.id)}>
                          {$t('automation.keys.rotate')}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onclick={() => onRevokeKey(key.id)} class="ui:text-destructive">
                          {$t('automation.keys.revoke')}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  {/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {:else}
        <Empty
          title={$t('automation.api.keys.empty_title')}
          description={$t('automation.api.keys.empty_description')}
          icon={KeyIcon}
          variant="page"
        >
          {#if $isOrgAdmin}
            <Button onclick={openCreateKeyModal} disabled={automationApi.isLoading || !$hasPublicApiAccess}>
              <PlusIcon size={16} />
              {$t('automation.api.keys.generate')}
            </Button>
          {/if}
        </Empty>
      {/if}
    {/if}
  </div>

  {#if hasActiveApiKey}
    <Field.Set class="gap-3!">
      <Field.Legend class="flex items-center gap-2">
        <CodeIcon class="size-5" />
        {$t('automation.api.setup.title')}
      </Field.Legend>
      <Field.Description>{$t('automation.api.setup.description')}</Field.Description>

      <Tabs.Root bind:value={activeSetupTab} class="w-full">
        <Tabs.List class="inline-flex w-auto">
          <Tabs.Trigger value="curl">{$t('automation.clients.curl')}</Tabs.Trigger>
          <Tabs.Trigger value="javascript">{$t('automation.clients.javascript')}</Tabs.Trigger>
          <Tabs.Trigger value="python">{$t('automation.clients.python')}</Tabs.Trigger>
          <Tabs.Trigger value="go">{$t('automation.clients.go')}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="curl" class="mt-4">
          <Code.Overflow>
            <Code.Root code={getPublicApiCurlSnippet(generatedSecret)}>
              <Code.CopyButton />
            </Code.Root>
          </Code.Overflow>
        </Tabs.Content>

        <Tabs.Content value="javascript" class="mt-4">
          <Code.Overflow>
            <Code.Root code={getPublicApiJavaScriptSnippet(generatedSecret)}>
              <Code.CopyButton />
            </Code.Root>
          </Code.Overflow>
        </Tabs.Content>

        <Tabs.Content value="python" class="mt-4">
          <Code.Overflow>
            <Code.Root code={getPublicApiPythonSnippet(generatedSecret)}>
              <Code.CopyButton />
            </Code.Root>
          </Code.Overflow>
        </Tabs.Content>

        <Tabs.Content value="go" class="mt-4">
          <Code.Overflow>
            <Code.Root code={getPublicApiGoSnippet(generatedSecret)}>
              <Code.CopyButton />
            </Code.Root>
          </Code.Overflow>
        </Tabs.Content>
      </Tabs.Root>
    </Field.Set>
  {/if}
</Field.Group>

<Dialog.Root
  bind:open={isCreateKeyModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      resetCreateKeyModal();
    }
  }}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('automation.api.keys.modal.title')}</Dialog.Title>
      <Dialog.Description>{$t('automation.api.keys.modal.description')}</Dialog.Description>
    </Dialog.Header>

    <div class="py-2">
      <InputField
        label={$t('automation.api.keys.modal.name_label')}
        placeholder={$t('automation.api.keys.modal.name_placeholder')}
        bind:value={keyLabel}
        errorMessage={automationApi.errors.label}
        autoFocus
      />
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isCreateKeyModalOpen = false)}>
        {$t('automation.api.keys.modal.cancel')}
      </Button>
      <Button onclick={onGenerateKey} loading={automationApi.isLoading} disabled={!canCreateKey}>
        {$t('automation.api.keys.modal.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
