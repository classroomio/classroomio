<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';

  import { currentOrg, isEnterprisePlan } from '$lib/utils/store/org';
  import { ssoStore } from '$features/org/store/sso.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { ssoApi } from '$features/org/api/sso.svelte';
  import { getRequestBaseUrl } from '$lib/utils/services/api';

  import { Badge } from '@cio/ui/base/badge';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import KeyIcon from '@lucide/svelte/icons/key';

  // Form states for creating connection
  let provider = $state('GOOGLE_WORKSPACE');
  let displayName = $state('');
  let issuer = $state('');
  let domain = $state('');
  let clientId = $state('');
  let clientSecret = $state('');

  // Policy states - bind to store
  let forceSso = $state(false);
  let autoJoinSsoDomains = $state(false);
  let breakGlassEnabled = $state(true);

  // Loading states
  let isActivating = $state(false);
  let isDeleting = $state(false);

  // Load config on first render
  $effect(() => {
    if (!$currentOrg?.id) return;

    ssoStore.loadConfig();
  });

  // Sync policy states from store
  $effect(() => {
    if (ssoStore.config?.policy) {
      forceSso = ssoStore.config.policy.forceSso;
      autoJoinSsoDomains = ssoStore.config.policy.autoJoinSsoDomains;
      breakGlassEnabled = ssoStore.config.policy.breakGlassEnabled;
    }
  });

  async function onCreateConnection() {
    if (!$isEnterprisePlan) {
      snackbar.error('upgrade.required');
      return;
    }

    const result = await ssoApi.createConnection({
      provider: provider as 'OKTA' | 'GOOGLE_WORKSPACE' | 'AUTH0',
      displayName,
      issuer,
      domain,
      clientId,
      clientSecret,
      scopes: 'openid profile email'
    });

    if (result?.data) {
      snackbar.success(t.get('settings.auth.sso.messages.created'));
      await ssoStore.refreshConfig();
    }
  }

  async function onActivate() {
    isActivating = true;
    const result = await ssoApi.activateConnection();
    if (result?.data) {
      ssoStore.updateConfig({ ...ssoStore.config!.config!, isActive: true });
      snackbar.success(t.get('settings.auth.sso.messages.activated'));
    }
    isActivating = false;
  }

  async function onDelete() {
    if (!confirm(t.get('settings.auth.sso.connection.delete_confirm'))) {
      return;
    }
    isDeleting = true;
    const result = await ssoApi.deleteConnection();
    if (result) {
      ssoStore.clear();
      snackbar.success(t.get('settings.auth.sso.messages.deleted'));
    }
    isDeleting = false;
  }

  async function onUpdatePolicy() {
    const result = await ssoApi.updatePolicy({
      forceSso,
      autoJoinSsoDomains,
      breakGlassEnabled
    });
    if (result?.data) {
      ssoStore.updatePolicy(result.data);
      snackbar.success($t('snackbar.success_update'));
    }
  }

  function getProviderLabel(p: string) {
    switch (p) {
      case 'OKTA':
        return t.get('settings.auth.sso.setup.providers.okta');
      case 'GOOGLE_WORKSPACE':
        return t.get('settings.auth.sso.setup.providers.google_workspace');
      case 'AUTH0':
        return t.get('settings.auth.sso.setup.providers.auth0');
      default:
        return p;
    }
  }

  function getCallbackUrl(providerId: string) {
    return `${getRequestBaseUrl()}/api/auth/sso/callback/${providerId}`;
  }
</script>

{#if ssoStore.isLoading && !ssoStore.isInitialized}
  <div class="flex justify-center py-10">
    <Spinner class="size-10! text-blue-700!" />
  </div>
{:else if ssoStore.config?.config}
  <!-- Existing SSO Connection -->
  <Field.Group class="w-full max-w-2xl! px-2">
    <Field.Set>
      <Field.Legend class="flex items-center gap-2">
        <ShieldIcon class="size-5" />
        {$t('settings.auth.sso.connection.heading')}
      </Field.Legend>
      <Field.Description>{$t('settings.auth.sso.connection.description')}</Field.Description>

      <div class="space-y-4 rounded-md border p-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-semibold">{ssoStore.config.config.displayName}</h3>

            <Badge variant={ssoStore.config.config.isActive ? 'default' : 'secondary'}>
              {ssoStore.config.config.isActive
                ? $t('settings.auth.sso.connection.active')
                : $t('settings.auth.sso.connection.inactive')}
            </Badge>
          </div>
          <p class="text-sm text-gray-500">
            {getProviderLabel(ssoStore.config.config.provider)} • {ssoStore.config.config.domain}
          </p>
        </div>

        <div class="flex gap-2">
          {#if !ssoStore.config.config.isActive}
            <Button variant="secondary" onclick={onActivate} loading={isActivating} disabled={isActivating}>
              {$t('settings.auth.sso.connection.activate_button')}
            </Button>
          {/if}
          <Button variant="destructive" onclick={onDelete} loading={isDeleting} disabled={isDeleting}>
            {$t('settings.auth.sso.connection.delete_button')}
          </Button>
        </div>
      </div>

      {#if ssoStore.config.config.isActive}
        <div class="mt-4 rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
          <p class="font-medium text-blue-800 dark:text-blue-200">
            {$t('settings.auth.sso.connection.callback_url_label')}
          </p>
          <code class="mt-1 block rounded bg-white p-2 text-xs break-all dark:bg-slate-800">
            {getCallbackUrl(ssoStore.config.config.betterAuthProviderId)}
          </code>
          <p class="mt-2 text-blue-600 dark:text-blue-300">
            {$t('settings.auth.sso.connection.callback_url_description')}
          </p>
        </div>
      {/if}
    </Field.Set>

    <Field.Separator />

    <!-- Policies -->
    <Field.Set>
      <Field.Legend class="flex items-center gap-2">
        <KeyIcon class="size-5" />
        {$t('settings.auth.sso.policies.heading')}
      </Field.Legend>
      <Field.Description>{$t('settings.auth.sso.policies.description')}</Field.Description>

      <div class="mt-4 space-y-4">
        <Field.Field orientation="horizontal">
          <Switch
            bind:checked={forceSso}
            onCheckedChange={onUpdatePolicy}
            disabled={!ssoStore.config.config.isActive}
          />
          <div class="space-y-0.5">
            <Field.Label>{$t('settings.auth.sso.policies.force_sso.label')}</Field.Label>
            <Field.Description>
              {$t('settings.auth.sso.policies.force_sso.description')}
            </Field.Description>
          </div>
        </Field.Field>

        <Field.Field orientation="horizontal">
          <Switch
            bind:checked={autoJoinSsoDomains}
            onCheckedChange={onUpdatePolicy}
            disabled={!ssoStore.config.config.isActive}
          />
          <div class="space-y-0.5">
            <Field.Label>{$t('settings.auth.sso.policies.auto_join.label')}</Field.Label>
            <Field.Description>
              {$t('settings.auth.sso.policies.auto_join.description')}
            </Field.Description>
          </div>
        </Field.Field>

        <Field.Field orientation="horizontal">
          <Switch
            bind:checked={breakGlassEnabled}
            onCheckedChange={onUpdatePolicy}
            disabled={!ssoStore.config.config.isActive}
          />
          <div class="space-y-0.5">
            <Field.Label>{$t('settings.auth.sso.policies.break_glass.label')}</Field.Label>
            <Field.Description>
              {$t('settings.auth.sso.policies.break_glass.description')}
            </Field.Description>
          </div>
        </Field.Field>
      </div>
    </Field.Set>
  </Field.Group>
{:else}
  <!-- Create New Connection -->
  <Field.Group class="w-full max-w-md! px-2">
    <Field.Set>
      <Field.Legend class="flex items-center gap-2">
        <ShieldIcon class="size-5" />
        {$t('settings.auth.sso.setup.heading')}
      </Field.Legend>
      <Field.Description>
        {$t('settings.auth.sso.setup.description')}
      </Field.Description>

      <Field.Field>
        <Field.Label>{$t('settings.auth.sso.setup.provider_label')}</Field.Label>
        <Select.Root type="single" bind:value={provider} disabled={!$isEnterprisePlan}>
          <Select.Trigger class="w-full">
            <p>{getProviderLabel(provider)}</p>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="OKTA">{$t('settings.auth.sso.setup.providers.okta')}</Select.Item>
            <Select.Item value="GOOGLE_WORKSPACE"
              >{$t('settings.auth.sso.setup.providers.google_workspace')}</Select.Item
            >
            <Select.Item value="AUTH0">{$t('settings.auth.sso.setup.providers.auth0')}</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.auth.sso.setup.display_name_label')}</Field.Label>
        <Input
          placeholder={$t('settings.auth.sso.setup.display_name_placeholder')}
          bind:value={displayName}
          class="w-full"
          disabled={!$isEnterprisePlan}
        />
        {#if ssoApi.errors.displayName}
          <Field.Error>{ssoApi.errors.displayName}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.auth.sso.setup.issuer_label')}</Field.Label>
        <Field.Description class="ui:text-muted-foreground"
          >{$t('settings.auth.sso.setup.issuer_help')}</Field.Description
        >
        <Input
          placeholder={$t('settings.auth.sso.setup.issuer_placeholder')}
          bind:value={issuer}
          class="w-full"
          disabled={!$isEnterprisePlan}
        />
        {#if ssoApi.errors.issuer}
          <Field.Error>{ssoApi.errors.issuer}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.auth.sso.setup.domain_label')}</Field.Label>
        <Input
          placeholder={$t('settings.auth.sso.setup.domain_placeholder')}
          bind:value={domain}
          class="w-full"
          disabled={!$isEnterprisePlan}
        />
        {#if ssoApi.errors.domain}
          <Field.Error>{ssoApi.errors.domain}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.auth.sso.setup.client_id_label')}</Field.Label>
        <Input
          placeholder={$t('settings.auth.sso.setup.client_id_placeholder')}
          bind:value={clientId}
          class="w-full"
          disabled={!$isEnterprisePlan}
        />
        {#if ssoApi.errors.clientId}
          <Field.Error>{ssoApi.errors.clientId}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.auth.sso.setup.client_secret_label')}</Field.Label>
        <Input
          type="password"
          placeholder={$t('settings.auth.sso.setup.client_secret_placeholder')}
          bind:value={clientSecret}
          class="w-full"
          disabled={!$isEnterprisePlan}
        />
        {#if ssoApi.errors.clientSecret}
          <Field.Error>{ssoApi.errors.clientSecret}</Field.Error>
        {/if}
      </Field.Field>

      <Button
        variant="default"
        onclick={onCreateConnection}
        loading={ssoApi.isLoading}
        disabled={ssoApi.isLoading || !$isEnterprisePlan}
      >
        {$t('settings.auth.sso.setup.create_button')}
      </Button>
    </Field.Set>
  </Field.Group>
{/if}
