<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { currentOrg, isEnterprisePlan } from '$lib/utils/store/org';
  import { tokenAuthApi } from '$features/org/api/token-auth.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { UpgradeBanner } from '$features/ui';
  import * as Field from '@cio/ui/base/field';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { Switch } from '@cio/ui/base/switch';
  import KeyIcon from '@lucide/svelte/icons/key';
  import CodeIcon from '@lucide/svelte/icons/code';
  import * as Code from '@cio/ui/custom/code';

  let isDeleting = $state(false);

  $effect(() => {
    if (!$currentOrg || tokenAuthApi.isFetched) return;

    tokenAuthApi.getStatus();
  });

  async function onGenerate() {
    if (!$isEnterprisePlan) return;
    await tokenAuthApi.generateSecret();
  }

  async function onRotate() {
    await tokenAuthApi.rotateSecret();
  }

  async function onDelete() {
    if (!confirm(t.get('settings.token_auth.delete') + '?')) return;
    isDeleting = true;
    await tokenAuthApi.deleteTokenAuth();
    isDeleting = false;
  }

  async function onToggleActive(checked: boolean) {
    await tokenAuthApi.activateTokenAuth(checked);
  }

  const codeExample = `const { SignJWT } = require('jose');

async function main() {
  // Secret generated above
  const secret = process.env.TOKEN_AUTH_SECRET;
  const baseUrl = 'https://api.classroomio.dev';

  const token = await new SignJWT({
    sub: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2m')
    .sign(new TextEncoder().encode(secret));

  const url = new URL('/api/auth/token-exchange', baseUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('redirect', '/');

  console.log('Open this URL in a browser (same origin as dashboard):');
  console.log(url.toString());
}
main();`;
</script>

<UpgradeBanner>{$t('upgrade.enterprise_required')}</UpgradeBanner>

{#if tokenAuthApi.isLoading && tokenAuthApi.tokenAuth === null && !tokenAuthApi.generatedSecret}
  <div class="flex justify-center py-10">
    <Spinner class="size-10! text-blue-700!" />
  </div>
{:else}
  <Field.Group class="w-full max-w-2xl! space-y-8 px-2">
    {#if tokenAuthApi.tokenAuth || tokenAuthApi.generatedSecret}
      <Field.Set>
        <Field.Legend class="flex items-center gap-2">
          <KeyIcon class="size-5" />
          {$t('settings.token_auth.heading')}
        </Field.Legend>
        <Field.Description>
          {$t('settings.token_auth.description')}
        </Field.Description>

        <div class="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="space-y-1">
              <p class="ui:text-muted-foreground text-sm font-medium">{$t('settings.token_auth.status')}</p>
              <Badge variant={tokenAuthApi.tokenAuth?.isActive ? 'default' : 'secondary'}>
                {tokenAuthApi.tokenAuth?.isActive
                  ? $t('settings.token_auth.active')
                  : $t('settings.token_auth.inactive')}
              </Badge>
            </div>
            {#if tokenAuthApi.tokenAuth?.createdAt}
              <p class="ui:text-muted-foreground text-sm">
                {$t('settings.token_auth.created_at')}: {new Date(
                  tokenAuthApi.tokenAuth.createdAt
                ).toLocaleDateString()}
              </p>
            {/if}
            {#if tokenAuthApi.tokenAuth?.secretLast4}
              <p class="ui:text-muted-foreground text-sm">
                {$t('settings.token_auth.secret_last4')} …{tokenAuthApi.tokenAuth.secretLast4}
              </p>
            {/if}
          </div>

          {#if tokenAuthApi.generatedSecret}
            <div
              class="mt-4 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
            >
              <p class="ui:text-amber-800 dark:ui:text-amber-200 text-sm font-medium">
                {$t('settings.token_auth.secret_shown_once')}
              </p>
              <div class="mt-2">
                <Code.Root
                  code={tokenAuthApi.generatedSecret ?? ''}
                  lang="bash"
                  hideLines={true}
                  variant="secondary"
                  class="ui:break-all ui:text-xs"
                />
              </div>
            </div>
          {/if}

          <div class="mt-4 flex flex-wrap gap-2">
            {#if !tokenAuthApi.tokenAuth?.isActive && tokenAuthApi.tokenAuth}
              <Button
                variant="default"
                onclick={() => onToggleActive(true)}
                loading={tokenAuthApi.isLoading}
                disabled={tokenAuthApi.isLoading}
              >
                {$t('settings.token_auth.activate')}
              </Button>
            {/if}
            {#if tokenAuthApi.tokenAuth?.isActive}
              <Button
                variant="secondary"
                onclick={() => onToggleActive(false)}
                loading={tokenAuthApi.isLoading}
                disabled={tokenAuthApi.isLoading}
              >
                {$t('settings.token_auth.deactivate')}
              </Button>
            {/if}
            {#if tokenAuthApi.tokenAuth}
              <Button
                variant="secondary"
                onclick={onRotate}
                loading={tokenAuthApi.isLoading}
                disabled={tokenAuthApi.isLoading}
              >
                {$t('settings.token_auth.rotate')}
              </Button>
              <Button variant="destructive" onclick={onDelete} loading={isDeleting} disabled={isDeleting}>
                {$t('settings.token_auth.delete')}
              </Button>
            {/if}
          </div>

          {#if tokenAuthApi.tokenAuth && !tokenAuthApi.generatedSecret}
            <div class="mt-4 flex flex-row items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5">
                <Field.Label class="text-base">{$t('settings.token_auth.status')}</Field.Label>
                <Field.Description>
                  {$t('settings.token_auth.active')} / {$t('settings.token_auth.inactive')}
                </Field.Description>
              </div>
              <Switch
                checked={tokenAuthApi.tokenAuth?.isActive ?? false}
                onCheckedChange={onToggleActive}
                disabled={tokenAuthApi.isLoading}
              />
            </div>
          {/if}
        </div>
      </Field.Set>
    {:else}
      <Field.Set>
        <Field.Legend class="flex items-center gap-2">
          <KeyIcon class="size-5" />
          {$t('settings.token_auth.heading')}
        </Field.Legend>
        <Field.Description>
          {$t('settings.token_auth.description')}
        </Field.Description>
        <p class="ui:text-muted-foreground text-sm">
          {$t('settings.token_auth.no_config')}
        </p>
        <Button
          variant="default"
          onclick={onGenerate}
          loading={tokenAuthApi.isLoading}
          disabled={tokenAuthApi.isLoading || !$isEnterprisePlan}
        >
          {$t('settings.token_auth.generate')}
        </Button>
      </Field.Set>
    {/if}

    <Field.Separator />

    <Field.Set>
      <Field.Legend class="flex items-center gap-2">
        <CodeIcon class="size-5" />
        {$t('settings.token_auth.integration_guide')}
      </Field.Legend>
      <Field.Description>
        {$t('settings.token_auth.integration_description')}
      </Field.Description>
      <div class="ui:w-full ui:rounded-lg ui:border ui:border-border">
        <Code.FileName filename="integration.js" />
        <Code.Overflow>
          <Code.Root code={codeExample} lang="javascript" class="ui:w-full ui:border-none">
            <Code.CopyButton />
          </Code.Root>
        </Code.Overflow>
      </div>
    </Field.Set>
  </Field.Group>
{/if}
