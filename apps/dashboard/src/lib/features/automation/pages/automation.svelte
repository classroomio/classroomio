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
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';
  import * as Code from '@cio/ui/custom/code';
  import * as Field from '@cio/ui/base/field';
  import * as Tabs from '@cio/ui/base/tabs';
  import KeyIcon from '@lucide/svelte/icons/key';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
  import BracesIcon from '@lucide/svelte/icons/braces';

  let activeTab = $state('mcp');
  let activeSetupTab = $state('claude-code');
  let isRevokingKeyId = $state<string | null>(null);
  let isRotatingKeyId = $state<string | null>(null);

  $effect(() => {
    if (!$isOrgAdmin || automationApi.isFetched) return;

    automationApi.listKeys('mcp');
  });

  async function onGenerateKey() {
    await automationApi.createKey('mcp');
  }

  async function onRevokeKey(keyId: string) {
    if (!confirm(t.get('automation.keys.revoke_confirm'))) return;

    isRevokingKeyId = keyId;
    await automationApi.revokeKey(keyId);
    isRevokingKeyId = null;
  }

  async function onRotateKey(keyId: string) {
    if (!confirm(t.get('automation.keys.rotate_confirm'))) return;

    isRotatingKeyId = keyId;
    await automationApi.rotateKey(keyId);
    isRotatingKeyId = null;
  }

  const mcpSecret = $derived(automationApi.generatedSecret);
  const mcpKeys = $derived(automationApi.keys.filter((key) => key.type === 'mcp'));
  const claudeCodeSnippet = $derived(getClaudeCodeSnippet(mcpSecret));
  const codexSnippet = $derived(getCodexSnippet(mcpSecret));
  const cursorSnippet = $derived(getCursorSnippet(mcpSecret));
</script>

<Field.Group class="w-full max-w-5xl! space-y-8 px-2">
  {#if !$isOrgAdmin}
    <Alert.Callout
      variant="information"
      title={$t('automation.permissions.disabled_title')}
      description={$t('automation.permissions.disabled_description')}
      class="w-full"
    />
  {/if}

  <Tabs.Root bind:value={activeTab} class="w-full">
    <Tabs.List class="grid w-full grid-cols-3">
      <Tabs.Trigger value="mcp">{$t('automation.tabs.mcp')}</Tabs.Trigger>
      <Tabs.Trigger value="zapier" disabled>
        <span>{$t('automation.tabs.zapier')}</span>
        <Badge variant="outline" class="text-[10px]!">{$t('automation.coming_soon')}</Badge>
      </Tabs.Trigger>
      <Tabs.Trigger value="api" disabled>
        <span>{$t('automation.tabs.api')}</span>
        <Badge variant="outline" class="text-[10px]!">{$t('automation.coming_soon')}</Badge>
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="mcp" class="space-y-8">
      <Field.Set>
        <Field.Legend class="flex items-center gap-2">
          <KeyIcon class="size-5" />
          {$t('automation.mcp.keys.title')}
        </Field.Legend>
        <Field.Description>{$t('automation.mcp.keys.description')}</Field.Description>

        <div class="flex flex-wrap items-center gap-3">
          <Button
            onclick={onGenerateKey}
            variant="secondary"
            loading={automationApi.isLoading}
            disabled={!$isOrgAdmin || automationApi.isLoading}
          >
            {$t('automation.mcp.keys.generate')}
          </Button>
        </div>

        {#if automationApi.generatedSecret}
          <div class="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p class="ui:text-amber-800 text-sm font-medium">{$t('automation.mcp.keys.secret_once')}</p>
            <div class="mt-3">
              <Code.Root
                code={automationApi.generatedSecret}
                lang="bash"
                hideLines={true}
                class="ui:break-all ui:text-xs"
              >
                <Code.CopyButton />
              </Code.Root>
            </div>
          </div>
        {/if}

        {#if $isOrgAdmin}
          {#if mcpKeys.length > 0}
            <div class="mt-6 grid gap-4 md:grid-cols-2">
              {#each mcpKeys as key (key.id)}
                <Card.Root>
                  <Card.Header>
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <Card.Title>{key.label}</Card.Title>
                        <Card.Description>{getMaskedAutomationSecret(key.secretPrefix)}</Card.Description>
                      </div>
                      <Badge variant={key.revokedAt ? 'secondary' : 'default'}>
                        {key.revokedAt ? $t('automation.keys.revoked') : $t('automation.keys.active')}
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Content class="space-y-2 text-sm">
                    <p>
                      <span class="font-medium">{$t('automation.keys.created_at_label')}</span>
                      {new Date(key.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <span class="font-medium">{$t('automation.keys.last_used_label')}</span>
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : $t('automation.keys.never_used')}
                    </p>
                    <p>
                      <span class="font-medium">{$t('automation.keys.scopes_label')}</span>
                      {key.scopes.join(', ')}
                    </p>
                  </Card.Content>
                  <Card.Footer class="flex gap-2">
                    <Button
                      variant="secondary"
                      onclick={() => onRotateKey(key.id)}
                      loading={isRotatingKeyId === key.id}
                      disabled={!$isOrgAdmin || Boolean(key.revokedAt)}
                    >
                      {$t('automation.keys.rotate')}
                    </Button>
                    <Button
                      variant="destructive"
                      onclick={() => onRevokeKey(key.id)}
                      loading={isRevokingKeyId === key.id}
                      disabled={!$isOrgAdmin || Boolean(key.revokedAt)}
                    >
                      {$t('automation.keys.revoke')}
                    </Button>
                  </Card.Footer>
                </Card.Root>
              {/each}
            </div>
          {:else}
            <Alert.Callout
              variant="information"
              title={$t('automation.keys.empty_title')}
              description={$t('automation.keys.empty_description')}
              class="mt-6 w-full"
            />
          {/if}
        {/if}
      </Field.Set>

      <Field.Separator />

      <Field.Set>
        <Field.Legend class="flex items-center gap-2">
          <SparklesIcon class="size-5" />
          {$t('automation.mcp.setup.title')}
        </Field.Legend>
        <Field.Description>{$t('automation.mcp.setup.description')}</Field.Description>

        <Tabs.Root bind:value={activeSetupTab} class="w-full">
          <Tabs.List class="inline-flex w-auto">
            <Tabs.Trigger value="claude-code">{$t('automation.clients.claude_code')}</Tabs.Trigger>
            <Tabs.Trigger value="codex">{$t('automation.clients.codex')}</Tabs.Trigger>
            <Tabs.Trigger value="cursor">{$t('automation.clients.cursor')}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="claude-code" class="mt-4">
            <Card.Root>
              <Card.Header>
                <Card.Title>{$t('automation.clients.claude_code')}</Card.Title>
                <Card.Description>{$t('automation.mcp.setup.claude_code_description')}</Card.Description>
              </Card.Header>
              <Card.Content>
                <Code.FileName filename="terminal" />
                <Code.Overflow>
                  <Code.Root code={claudeCodeSnippet} lang="bash" class="ui:w-full ui:border-none">
                    <Code.CopyButton />
                  </Code.Root>
                </Code.Overflow>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="codex" class="mt-4">
            <Card.Root>
              <Card.Header>
                <Card.Title>{$t('automation.clients.codex')}</Card.Title>
                <Card.Description>{$t('automation.mcp.setup.codex_description')}</Card.Description>
              </Card.Header>
              <Card.Content>
                <Code.FileName filename="terminal" />
                <Code.Overflow>
                  <Code.Root code={codexSnippet} lang="bash" class="ui:w-full ui:border-none">
                    <Code.CopyButton />
                  </Code.Root>
                </Code.Overflow>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="cursor" class="mt-4">
            <Card.Root>
              <Card.Header>
                <Card.Title>{$t('automation.clients.cursor')}</Card.Title>
                <Card.Description>{$t('automation.mcp.setup.cursor_description')}</Card.Description>
              </Card.Header>
              <Card.Content>
                <Code.FileName filename="mcp.json" />
                <Code.Overflow>
                  <Code.Root code={cursorSnippet} lang="json" class="ui:w-full ui:border-none">
                    <Code.CopyButton />
                  </Code.Root>
                </Code.Overflow>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>
      </Field.Set>
    </Tabs.Content>

    <Tabs.Content value="zapier" class="mt-6">
      <Alert.Callout
        variant="information"
        title={$t('automation.tabs.zapier')}
        description={$t('automation.coming_soon')}
        class="w-full"
      />
    </Tabs.Content>

    <Tabs.Content value="api" class="mt-6">
      <Alert.Callout
        variant="information"
        title={$t('automation.tabs.api')}
        description={$t('automation.coming_soon')}
        class="w-full"
      />
    </Tabs.Content>
  </Tabs.Root>
</Field.Group>
