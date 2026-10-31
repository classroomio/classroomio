<script lang="ts">
  import { automationApi } from '$features/automation/api/automation.svelte';
  import { getMaskedAutomationSecret, MCP_DOCS_URL } from '$features/automation/utils/automation-utils';
  import KeySecretDialog from '$features/automation/components/key-secret-dialog.svelte';
  import { summarizeOAuthScopes } from '$features/oauth/utils/oauth-scopes';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import * as Alert from '@cio/ui/base/alert';
  import { Badge } from '@cio/ui/base/badge';
  import * as Code from '@cio/ui/custom/code';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Field from '@cio/ui/base/field';
  import * as Table from '@cio/ui/base/table';
  import * as Tabs from '@cio/ui/base/tabs';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import PlugIcon from '@lucide/svelte/icons/plug';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  let activeTab = $state('connections');
  let generatedSecret = $state<string | null>(null);
  let generatedSecretKeyId = $state<string | null>(null);
  let isSecretDialogOpen = $state(false);

  async function onRevokeKey(keyId: string) {
    if (!confirm(t.get('automation.keys.revoke_confirm'))) return;

    const result = await automationApi.revokeKey(keyId);
    if (result && generatedSecretKeyId === keyId) {
      generatedSecret = null;
      generatedSecretKeyId = null;
    }
  }

  async function onRotateKey(keyId: string) {
    if (!confirm(t.get('automation.keys.rotate_confirm'))) return;

    const result = await automationApi.rotateKey(keyId);
    if (!result || result.data.key.revokedAt) return;

    const key = automationApi.keys.find((entry) => entry.id === keyId);
    if (!key || key.revokedAt) return;

    generatedSecret = automationApi.generatedSecret;
    generatedSecretKeyId = keyId;
    automationApi.clearGeneratedSecret();
    isSecretDialogOpen = true;
  }

  async function onRevokeConnectedApp(consentId: string) {
    if (!confirm(t.get('oauth.connected_apps.revoke_confirm'))) return;

    await automationApi.revokeConnectedApp(consentId);
  }

  const mcpKeys = $derived(automationApi.keys.filter((key) => key.type === 'mcp'));
  const hasConnectedApps = $derived(automationApi.connectedApps.length > 0);
</script>

{#snippet connections()}
  {#if hasConnectedApps}
    <div class="space-y-3">
      <div class="flex items-center gap-2 font-medium">
        <PlugIcon class="size-5" />
        {$t('oauth.connected_apps.title')}
      </div>
      <p class="ui:text-muted-foreground text-sm">{$t('oauth.connected_apps.description')}</p>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{$t('oauth.connected_apps.table_app')}</Table.Head>
            <Table.Head>{$t('oauth.connected_apps.table_authorized_by')}</Table.Head>
            <Table.Head>{$t('oauth.connected_apps.table_permissions')}</Table.Head>
            <Table.Head>{$t('automation.keys.table_last_used')}</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each automationApi.connectedApps as app (app.consentId)}
            <Table.Row>
              <Table.Cell class="font-medium">{app.clientName ?? $t('oauth.consent.unknown_client')}</Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-sm">{app.userFullname ?? '-'}</Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-sm">
                {$t('oauth.connected_apps.permissions_count', { count: summarizeOAuthScopes(app.scopes).length })}
              </Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-sm">
                {app.lastUsedAt ? new Date(app.lastUsedAt).toLocaleDateString() : $t('automation.keys.never_used')}
              </Table.Cell>
              <Table.Cell>
                <IconButton
                  aria-label={$t('oauth.connected_apps.revoke')}
                  tooltip={$t('oauth.connected_apps.revoke')}
                  onclick={() => onRevokeConnectedApp(app.consentId)}
                  testId="oauth-connected-app-revoke-{app.consentId}"
                >
                  <Trash2Icon size={16} />
                </IconButton>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {:else}
    <Field.Set class="gap-3!">
      <Field.Legend class="flex items-center gap-2">
        <PlugIcon class="size-5" />
        {$t('oauth.connect.title')}
      </Field.Legend>
      <Field.Description>{$t('oauth.connect.description')}</Field.Description>

      {#if automationApi.mcpUrl}
        <Code.Root code={automationApi.mcpUrl} lang="bash" hideLines>
          <Code.CopyButton />
        </Code.Root>
      {/if}

      <ol class="ui:text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
        <li>{$t('oauth.connect.step_1')}</li>
        <li>{$t('oauth.connect.step_2')}</li>
        <li>{$t('oauth.connect.step_3')}</li>
      </ol>
    </Field.Set>
  {/if}
{/snippet}

<Field.Group class="mx-auto w-full space-y-2">
  {#if !$isOrgAdmin}
    <Alert.Callout
      variant="information"
      title={$t('automation.permissions.disabled_title')}
      description={$t('automation.permissions.disabled_description')}
      class="w-full"
    />
  {:else if mcpKeys.length > 0}
    <Tabs.Root bind:value={activeTab} class="w-full">
      <Tabs.List class="self-start">
        <Tabs.Trigger value="connections" class="flex-none px-3">{$t('automation.mcp.connections_tab')}</Tabs.Trigger>
        <Tabs.Trigger value="keys" class="flex-none gap-2 px-3">
          {$t('automation.mcp.keys.title')}
          <Badge
            variant="outline"
            class="border-transparent bg-orange-100 px-1.5 py-0 text-[10px] leading-4 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
          >
            {$t('automation.mcp.keys.deprecated_badge')}
          </Badge>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="connections" class="mt-4">
        {@render connections()}
      </Tabs.Content>

      <Tabs.Content value="keys" class="mt-4">
        <div class="space-y-3">
          <p class="ui:text-muted-foreground text-sm">{$t('automation.mcp.keys.description')}</p>

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
              {#each mcpKeys as key (key.id)}
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
        </div>
      </Tabs.Content>
    </Tabs.Root>
  {:else}
    {@render connections()}
  {/if}
</Field.Group>

<KeySecretDialog
  bind:open={isSecretDialogOpen}
  title={$t('automation.mcp.keys.reveal_title')}
  secret={generatedSecret}
  docsHref={MCP_DOCS_URL}
/>
