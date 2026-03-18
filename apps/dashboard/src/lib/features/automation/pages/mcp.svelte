<script lang="ts">
  import { automationApi } from '$features/automation/api/automation.svelte';
  import {
    getClaudeCodeSnippet,
    getCodexSnippet,
    getCursorSnippet,
    getMaskedAutomationSecret
  } from '$features/automation/utils/automation-utils';
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
  import CoinsIcon from '@lucide/svelte/icons/coins';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import GaugeIcon from '@lucide/svelte/icons/gauge';
  import KeyIcon from '@lucide/svelte/icons/key';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  import { ActivityCard } from '$features/ui';

  let activeSetupTab = $state('cursor');
  let generatedSecret = $state<string | null>(null);

  async function onGenerateKey() {
    await automationApi.createKey('mcp');
    generatedSecret = automationApi.generatedSecret;
    automationApi.clearGeneratedSecret();
  }

  async function onRevokeKey(keyId: string) {
    if (!confirm(t.get('automation.keys.revoke_confirm'))) return;
    await automationApi.revokeKey(keyId);
  }

  async function onRotateKey(keyId: string) {
    if (!confirm(t.get('automation.keys.rotate_confirm'))) return;
    await automationApi.rotateKey(keyId);
    generatedSecret = automationApi.generatedSecret;
    automationApi.clearGeneratedSecret();
  }
  const mcpKeys = $derived(automationApi.keys.filter((key) => key.type === 'mcp'));
  const usageCards = $derived.by(() => {
    if (!automationApi.usage) return [];

    return [
      {
        icon: CoinsIcon,
        title: t.get('automation.mcp.usage.credits_title'),
        percentage: automationApi.usage.monthlyCreditsRemaining,
        description: `${t.get('automation.mcp.usage.used_label')} ${automationApi.usage.monthlyCreditsUsed} / ${automationApi.usage.monthlyCreditsIncluded}`,
        hidePercentage: true
      },
      {
        icon: KeyIcon,
        title: t.get('automation.mcp.usage.keys_title'),
        percentage: automationApi.usage.activeKeys,
        description: `${t.get('automation.mcp.usage.used_label')} ${automationApi.usage.activeKeys} / ${automationApi.usage.maxActiveKeys}`,
        hidePercentage: true
      },
      {
        icon: GaugeIcon,
        title: t.get('automation.mcp.usage.rate_limits_title'),
        percentage: `${automationApi.usage.rateLimits.perKey.readPerMinute} / ${automationApi.usage.rateLimits.perKey.writePerMinute} / ${automationApi.usage.rateLimits.perKey.publishPerMinute}`,
        description: `${t.get('automation.mcp.usage.rate_limits_description')}`,
        hidePercentage: true
      }
    ];
  });

  const isLastUsageCard = (index: number) => index === usageCards.length - 1;
</script>

<Field.Group class="mx-auto w-full space-y-2">
  {#if !$isOrgAdmin}
    <Alert.Callout
      variant="information"
      title={$t('automation.permissions.disabled_title')}
      description={$t('automation.permissions.disabled_description')}
      class="w-full"
    />
  {/if}

  {#if $isOrgAdmin && automationApi.usage}
    <div class="grid gap-4 md:grid-cols-3">
      {#each usageCards as card, i (i)}
        <ActivityCard
          activity={card}
          classes={{
            percentage: isLastUsageCard(i) ? 'text-lg' : undefined
          }}
        />
      {/each}
    </div>
  {/if}

  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 font-medium">
        <KeyIcon class="size-5" />
        {$t('automation.mcp.keys.title')}
      </div>
      {#if $isOrgAdmin}
        <IconButton
          onclick={onGenerateKey}
          disabled={automationApi.isLoading}
          tooltip={$t('automation.mcp.keys.generate')}
        >
          <PlusIcon size={16} />
        </IconButton>
      {/if}
    </div>
    <p class="ui:text-muted-foreground text-sm">{$t('automation.mcp.keys.description')}</p>

    {#if generatedSecret}
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p class="ui:text-amber-800 text-sm font-medium">{$t('automation.mcp.keys.secret_once')}</p>
        <div class="mt-3">
          <Code.Root code={generatedSecret} lang="bash" hideLines={true} class="ui:break-all ui:text-xs">
            <Code.CopyButton />
          </Code.Root>
        </div>
      </div>
    {/if}

    {#if $isOrgAdmin}
      {#if mcpKeys.length > 0}
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
      {:else}
        <Alert.Callout
          variant="information"
          title={$t('automation.keys.empty_title')}
          description={$t('automation.keys.empty_description')}
          class="w-full"
        />
      {/if}
    {/if}
  </div>

  <Field.Set class="gap-3!">
    <Field.Legend class="flex items-center gap-2">
      <SparklesIcon class="size-5" />
      {$t('automation.mcp.setup.title')}
    </Field.Legend>
    <Field.Description>{$t('automation.mcp.setup.description')}</Field.Description>

    <Tabs.Root bind:value={activeSetupTab} class="w-full">
      <Tabs.List class="inline-flex w-auto">
        <Tabs.Trigger value="cursor">{$t('automation.clients.cursor')}</Tabs.Trigger>
        <Tabs.Trigger value="claude-code">{$t('automation.clients.claude_code')}</Tabs.Trigger>
        <Tabs.Trigger value="codex">{$t('automation.clients.codex')}</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="claude-code" class="mt-4">
        <Code.Overflow>
          <Code.Root code={getClaudeCodeSnippet(generatedSecret)} lang="bash">
            <Code.CopyButton />
          </Code.Root>
        </Code.Overflow>
      </Tabs.Content>

      <Tabs.Content value="codex" class="mt-4">
        <Code.Overflow>
          <Code.Root code={getCodexSnippet(generatedSecret)} lang="bash">
            <Code.CopyButton />
          </Code.Root>
        </Code.Overflow>
      </Tabs.Content>

      <Tabs.Content value="cursor" class="mt-4">
        <Code.Overflow>
          <Code.Root code={getCursorSnippet(generatedSecret)} lang="json">
            <Code.CopyButton />
          </Code.Root>
        </Code.Overflow>
      </Tabs.Content>
    </Tabs.Root>
  </Field.Set>
</Field.Group>
