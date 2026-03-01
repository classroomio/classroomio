<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';

  import { currentOrg, isEnterprisePlan } from '$lib/utils/store/org';
  import { ssoStore } from '$features/org/store/sso.svelte';
  import { ssoApi } from '$features/org/api/sso.svelte';
  import type { SsoConfig } from '$features/org/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';

  import { Badge } from '@cio/ui/base/badge';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { UpgradeBanner } from '$features/ui';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import KeyIcon from '@lucide/svelte/icons/key';
  import * as Code from '@cio/ui/custom/code';

  // Form states for creating connection
  let provider = $state('OKTA');
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
    if (!$currentOrg) return;
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
      snackbar.success('SSO connection created successfully');
      // Refresh store to get latest data
      await ssoStore.refreshConfig();
    }
  }

  async function onActivate() {
    isActivating = true;
    const result = await ssoApi.activateConnection();
    if (result?.data) {
      // Update store directly
      ssoStore.updateConfig({ ...ssoStore.config!.config!, isActive: true });
      snackbar.success('SSO connection activated');
    }
    isActivating = false;
  }

  async function onDelete() {
    if (!confirm('Are you sure you want to delete this SSO connection?')) {
      return;
    }
    isDeleting = true;
    const result = await ssoApi.deleteConnection();
    if (result) {
      ssoStore.clear();
      snackbar.success('SSO connection deleted');
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
      // Update store: API returns roleMapping as JSONValue; normalize to policy type
      const policy: SsoConfig['policy'] = {
        ...result.data,
        roleMapping:
          result.data.roleMapping &&
          typeof result.data.roleMapping === 'object' &&
          !Array.isArray(result.data.roleMapping)
            ? (result.data.roleMapping as Record<string, number>)
            : {}
      };
      ssoStore.updatePolicy(policy);
      snackbar.success(t.get('snackbar.success_update'));
    }
  }

  function getProviderLabel(p: string) {
    switch (p) {
      case 'OKTA':
        return 'Okta';
      case 'GOOGLE_WORKSPACE':
        return 'Google Workspace';
      case 'AUTH0':
        return 'Auth0';
      default:
        return p;
    }
  }

  function getCallbackUrl(providerId: string) {
    return `${window.location.origin}/api/auth/sso/callback/${providerId}`;
  }
</script>

<UpgradeBanner>{$t('upgrade.enterprise_required')}</UpgradeBanner>

{#if ssoStore.isLoading && !ssoStore.isInitialized}
  <div class="flex justify-center py-10">
    <Spinner class="size-10! text-blue-700!" />
  </div>
{:else if ssoStore.config?.config}
  <!-- Existing SSO Connection -->
  <Field.Group class="w-full max-w-2xl! space-y-8 px-2">
    <!-- Connection Status -->
    <Field.Set>
      <Field.Legend class="flex items-center gap-2">
        <ShieldIcon class="size-5" />
        SSO Connection
      </Field.Legend>
      <Field.Description>Manage your SSO connection status</Field.Description>

      <div class="mt-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold">{ssoStore.config.config.displayName}</h3>
            <p class="text-sm text-gray-500">
              {getProviderLabel(ssoStore.config.config.provider)} • {ssoStore.config.config.domain}
            </p>
          </div>
          <Badge variant={ssoStore.config.config.isActive ? 'default' : 'secondary'}>
            {ssoStore.config.config.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div class="mt-4 flex gap-2">
          {#if !ssoStore.config.config.isActive}
            <Button variant="default" onclick={onActivate} loading={isActivating} disabled={isActivating}>
              Activate Connection
            </Button>
          {/if}
          <Button variant="destructive" onclick={onDelete} loading={isDeleting} disabled={isDeleting}>Delete</Button>
        </div>
      </div>

      {#if ssoStore.config.config.isActive}
        <div class="mt-4 rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
          <p class="font-medium text-blue-800 dark:text-blue-200">Callback URL:</p>
          <div class="relative mt-1">
            <Code.Root
              code={getCallbackUrl(ssoStore.config.config.betterAuthProviderId)}
              lang="bash"
              hideLines={true}
              variant="secondary"
              class="ui:break-all ui:text-xs"
            >
              <Code.CopyButton />
            </Code.Root>
          </div>
          <p class="mt-2 text-blue-600 dark:text-blue-300">
            Copy this URL to your IdP's callback/redirect URL configuration.
          </p>
        </div>
      {/if}
    </Field.Set>

    <Field.Separator />

    <!-- Policies -->
    <Field.Set>
      <Field.Legend class="flex items-center gap-2">
        <KeyIcon class="size-5" />
        Access Policies
      </Field.Legend>
      <Field.Description>Configure how users access your organization</Field.Description>

      <div class="mt-4 space-y-4">
        <Field.Field class="flex flex-row items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Field.Label class="text-base">Force SSO</Field.Label>
            <Field.Description>
              Require all users to sign in via SSO. Email/password login will be disabled.
            </Field.Description>
          </div>
          <Switch
            bind:checked={forceSso}
            onCheckedChange={onUpdatePolicy}
            disabled={!ssoStore.config.config.isActive}
          />
        </Field.Field>

        <Field.Field class="flex flex-row items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Field.Label class="text-base">Auto-join</Field.Label>
            <Field.Description>
              Allow users with matching email domains to automatically join your organization.
            </Field.Description>
          </div>
          <Switch
            bind:checked={autoJoinSsoDomains}
            onCheckedChange={onUpdatePolicy}
            disabled={!ssoStore.config.config.isActive}
          />
        </Field.Field>

        <Field.Field class="flex flex-row items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <Field.Label class="text-base">Break-glass Access</Field.Label>
            <Field.Description>Allow admins to bypass SSO with email/password in case of emergency.</Field.Description>
          </div>
          <Switch
            bind:checked={breakGlassEnabled}
            onCheckedChange={onUpdatePolicy}
            disabled={!ssoStore.config.config.isActive}
          />
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
        Setup SSO
      </Field.Legend>
      <Field.Description class="mb-5">
        Configure Single Sign-On for your organization. This feature requires an Enterprise plan.
      </Field.Description>

      <Field.Group class="space-y-4">
        <Field.Field>
          <Field.Label>Provider</Field.Label>
          <Select.Root type="single" bind:value={provider} disabled={!$isEnterprisePlan}>
            <Select.Trigger class="w-full">
              <p>{getProviderLabel(provider)}</p>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="OKTA">Okta</Select.Item>
              <Select.Item value="GOOGLE_WORKSPACE">Google Workspace</Select.Item>
              <Select.Item value="AUTH0">Auth0</Select.Item>
            </Select.Content>
          </Select.Root>
        </Field.Field>

        <Field.Field>
          <Field.Label>Display Name</Field.Label>
          <Input
            placeholder="e.g., Acme Corp SSO"
            bind:value={displayName}
            class="w-full"
            disabled={!$isEnterprisePlan}
          />
          {#if ssoApi.errors.displayName}
            <Field.Error>{ssoApi.errors.displayName}</Field.Error>
          {/if}
        </Field.Field>

        <Field.Field>
          <Field.Label>Issuer URL</Field.Label>
          <Input
            placeholder="https://your-org.okta.com"
            bind:value={issuer}
            class="w-full"
            disabled={!$isEnterprisePlan}
          />
          {#if ssoApi.errors.issuer}
            <Field.Error>{ssoApi.errors.issuer}</Field.Error>
          {/if}
        </Field.Field>

        <Field.Field>
          <Field.Label>Email Domain</Field.Label>
          <Input placeholder="yourcompany.com" bind:value={domain} class="w-full" disabled={!$isEnterprisePlan} />
          {#if ssoApi.errors.domain}
            <Field.Error>{ssoApi.errors.domain}</Field.Error>
          {/if}
        </Field.Field>

        <Field.Field>
          <Field.Label>Client ID</Field.Label>
          <Input placeholder="From your IdP" bind:value={clientId} class="w-full" disabled={!$isEnterprisePlan} />
          {#if ssoApi.errors.clientId}
            <Field.Error>{ssoApi.errors.clientId}</Field.Error>
          {/if}
        </Field.Field>

        <Field.Field>
          <Field.Label>Client Secret</Field.Label>
          <Input
            type="password"
            placeholder="From your IdP"
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
          Create Connection
        </Button>
      </Field.Group>
    </Field.Set>
  </Field.Group>
{/if}
