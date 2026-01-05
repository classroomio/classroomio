<script lang="ts">
  import { onMount } from 'svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import * as Card from '@cio/ui/base/card';
  import { Switch } from '@cio/ui/base/switch';
  import { Badge } from '@cio/ui/base/badge';
  import { Separator } from '@cio/ui/base/separator';
  import { apiClient } from '$lib/utils/services/api';
  import { CircleCheckIcon, WarningIcon } from '$features/ui/icons';

  // SSO Provider options
  const PROVIDER_OPTIONS = [
    { value: 'okta', label: 'Okta' },
    { value: 'auth0', label: 'Auth0' },
    { value: 'google_workspace', label: 'Google Workspace' },
    { value: 'azure_ad', label: 'Microsoft Entra ID (Azure AD)' },
    { value: 'custom', label: 'Custom Provider' }
  ];

  const PROVIDER_TYPE_OPTIONS = [
    { value: 'oidc', label: 'OpenID Connect (OIDC)' },
    { value: 'saml', label: 'SAML 2.0' }
  ];

  // State
  let loading = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // SSO Config state
  let ssoEnabled = $state(false);
  let providerType = $state<'oidc' | 'saml'>('oidc');
  let providerName = $state('okta');
  let displayName = $state('');
  let forceSso = $state(false);
  let autoProvisionUsers = $state(true);
  let allowedDomains = $state('');
  let hasExistingConfig = $state(false);

  // OIDC Config
  let oidcIssuerUrl = $state('');
  let oidcClientId = $state('');
  let oidcClientSecret = $state('');
  let oidcScopes = $state('openid profile email');

  // SAML Config
  let samlIdpEntityId = $state('');
  let samlIdpSsoUrl = $state('');
  let samlIdpCertificate = $state('');
  let samlMetadataXml = $state('');

  // Fetch existing config on mount
  onMount(async () => {
    await fetchSsoConfig();
  });

  async function fetchSsoConfig() {
    if (!$currentOrg?.id) return;

    loading = true;
    error = null;

    try {
      const response = await apiClient.request('/sso/config', {
        method: 'GET',
        headers: {
          'cio-org-id': $currentOrg.id
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        const config = result.data;
        hasExistingConfig = true;
        ssoEnabled = config.enabled;
        providerType = config.providerType;
        providerName = config.providerName;
        displayName = config.displayName || '';
        forceSso = config.forceSso;
        autoProvisionUsers = config.autoProvisionUsers;
        allowedDomains = config.allowedDomains?.join(', ') || '';

        if (config.oidcConfig) {
          oidcIssuerUrl = config.oidcConfig.issuerUrl || '';
          oidcClientId = config.oidcConfig.clientId || '';
          oidcClientSecret = config.oidcConfig.clientSecret || '';
          oidcScopes = config.oidcConfig.scopes?.join(' ') || 'openid profile email';
        }

        if (config.samlConfig) {
          samlIdpEntityId = config.samlConfig.idpEntityId || '';
          samlIdpSsoUrl = config.samlConfig.idpSsoUrl || '';
          samlIdpCertificate = config.samlConfig.idpCertificate || '';
        }
      }
    } catch (err) {
      console.error('Failed to fetch SSO config:', err);
      // Not an error if config doesn't exist yet
    } finally {
      loading = false;
    }
  }

  async function saveSsoConfig() {
    if (!$currentOrg?.id) return;

    saving = true;
    error = null;
    success = null;

    try {
      const payload: Record<string, unknown> = {
        providerType,
        providerName,
        displayName: displayName || undefined,
        enabled: ssoEnabled,
        forceSso,
        autoProvisionUsers,
        allowedDomains: allowedDomains ? allowedDomains.split(',').map((d) => d.trim()) : undefined
      };

      if (providerType === 'oidc') {
        payload.oidcConfig = {
          issuerUrl: oidcIssuerUrl || undefined,
          clientId: oidcClientId || undefined,
          clientSecret: oidcClientSecret !== '********' ? oidcClientSecret : undefined,
          scopes: oidcScopes ? oidcScopes.split(' ').filter(Boolean) : undefined
        };
      } else {
        payload.samlConfig = {
          idpEntityId: samlIdpEntityId || undefined,
          idpSsoUrl: samlIdpSsoUrl || undefined,
          idpCertificate: samlIdpCertificate || undefined
        };
      }

      const response = await apiClient.request('/sso/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': $currentOrg.id
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        hasExistingConfig = true;
        success = 'SSO configuration saved successfully';
        setTimeout(() => (success = null), 3000);
      } else {
        error = result.error || 'Failed to save SSO configuration';
      }
    } catch (err) {
      console.error('Failed to save SSO config:', err);
      error = 'Failed to save SSO configuration';
    } finally {
      saving = false;
    }
  }

  async function deleteSsoConfig() {
    if (!$currentOrg?.id) return;
    if (!confirm('Are you sure you want to delete the SSO configuration? Users will no longer be able to sign in with SSO.')) {
      return;
    }

    saving = true;
    error = null;

    try {
      const response = await apiClient.request('/sso/config', {
        method: 'DELETE',
        headers: {
          'cio-org-id': $currentOrg.id
        }
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        hasExistingConfig = false;
        ssoEnabled = false;
        providerType = 'oidc';
        providerName = 'okta';
        displayName = '';
        forceSso = false;
        autoProvisionUsers = true;
        allowedDomains = '';
        oidcIssuerUrl = '';
        oidcClientId = '';
        oidcClientSecret = '';
        oidcScopes = 'openid profile email';
        samlIdpEntityId = '';
        samlIdpSsoUrl = '';
        samlIdpCertificate = '';
        success = 'SSO configuration deleted';
        setTimeout(() => (success = null), 3000);
      } else {
        error = result.error || 'Failed to delete SSO configuration';
      }
    } catch (err) {
      console.error('Failed to delete SSO config:', err);
      error = 'Failed to delete SSO configuration';
    } finally {
      saving = false;
    }
  }

  async function parseSamlMetadata() {
    if (!samlMetadataXml || !$currentOrg?.id) return;

    saving = true;
    error = null;

    try {
      const response = await apiClient.request('/sso/saml/parse-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cio-org-id': $currentOrg.id
        },
        body: JSON.stringify({ metadataXml: samlMetadataXml })
      });

      const result = await response.json();

      if (result.success && result.data) {
        const parsed = result.data;
        if (parsed.idpEntityId) samlIdpEntityId = parsed.idpEntityId;
        if (parsed.idpSsoUrl) samlIdpSsoUrl = parsed.idpSsoUrl;
        if (parsed.idpCertificate) samlIdpCertificate = parsed.idpCertificate;
        samlMetadataXml = '';
        success = 'SAML metadata parsed successfully';
        setTimeout(() => (success = null), 3000);
      } else {
        error = result.error || 'Failed to parse SAML metadata';
      }
    } catch (err) {
      console.error('Failed to parse SAML metadata:', err);
      error = 'Failed to parse SAML metadata';
    } finally {
      saving = false;
    }
  }

  // Get provider help text
  function getProviderHelpText(provider: string): string {
    switch (provider) {
      case 'okta':
        return 'Create an OIDC or SAML application in your Okta admin console.';
      case 'auth0':
        return 'Create a Regular Web Application in your Auth0 dashboard.';
      case 'google_workspace':
        return 'Configure SAML app in Google Admin Console > Apps > Web and mobile apps.';
      case 'azure_ad':
        return 'Register an Enterprise Application in Microsoft Entra ID (Azure AD).';
      default:
        return 'Configure your identity provider with the appropriate settings.';
    }
  }
</script>

<Field.Group class="w-full space-y-6 px-2">
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <span class="text-muted-foreground">Loading SSO configuration...</span>
    </div>
  {:else}
    <!-- Status Messages -->
    {#if error}
      <div class="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3">
        <WarningIcon size={16} />
        <span>{error}</span>
      </div>
    {/if}

    {#if success}
      <div class="flex items-center gap-2 rounded-md bg-green-100 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        <CircleCheckIcon size={16} />
        <span>{success}</span>
      </div>
    {/if}

    <!-- SSO Enable/Disable -->
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <div>
            <Card.Title>Single Sign-On (SSO)</Card.Title>
            <Card.Description>Allow users to sign in using your organization's identity provider.</Card.Description>
          </div>
          <div class="flex items-center gap-2">
            {#if ssoEnabled}
              <Badge variant="default">Enabled</Badge>
            {:else}
              <Badge variant="secondary">Disabled</Badge>
            {/if}
          </div>
        </div>
      </Card.Header>
    </Card.Root>

    <!-- Provider Selection -->
    <Field.Set>
      <Field.Legend>Identity Provider</Field.Legend>

      <Field.Field>
        <Field.Label for="provider">Provider</Field.Label>
        <Select.Root type="single" name="provider" bind:value={providerName}>
          <Select.Trigger class="w-full md:w-80">
            {PROVIDER_OPTIONS.find((p) => p.value === providerName)?.label || 'Select provider'}
          </Select.Trigger>
          <Select.Content>
            {#each PROVIDER_OPTIONS as option}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Field.Description>{getProviderHelpText(providerName)}</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label for="providerType">Protocol</Field.Label>
        <Select.Root type="single" name="providerType" bind:value={providerType}>
          <Select.Trigger class="w-full md:w-80">
            {PROVIDER_TYPE_OPTIONS.find((p) => p.value === providerType)?.label || 'Select protocol'}
          </Select.Trigger>
          <Select.Content>
            {#each PROVIDER_TYPE_OPTIONS as option}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Field.Description>
          {providerType === 'oidc' ? 'Recommended for most providers. Uses OAuth 2.0 with OpenID Connect.' : 'Traditional enterprise SSO protocol. Use if your IdP requires SAML.'}
        </Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label for="displayName">Button Label (Optional)</Field.Label>
        <Input
          id="displayName"
          bind:value={displayName}
          placeholder="e.g., Sign in with Company SSO"
          class="w-full md:w-80"
        />
        <Field.Description>Custom label for the SSO button on the login page.</Field.Description>
      </Field.Field>
    </Field.Set>

    <Separator />

    <!-- OIDC Configuration -->
    {#if providerType === 'oidc'}
      <Field.Set>
        <Field.Legend>OpenID Connect Configuration</Field.Legend>

        <Field.Field>
          <Field.Label for="oidcIssuerUrl">Issuer URL *</Field.Label>
          <Input
            id="oidcIssuerUrl"
            bind:value={oidcIssuerUrl}
            placeholder="https://your-domain.okta.com"
            class="w-full"
          />
          <Field.Description>
            The base URL of your identity provider. Used to discover OIDC endpoints automatically.
          </Field.Description>
        </Field.Field>

        <Field.Field>
          <Field.Label for="oidcClientId">Client ID *</Field.Label>
          <Input id="oidcClientId" bind:value={oidcClientId} placeholder="0oa1b2c3d4e5f6g7h8i9" class="w-full" />
        </Field.Field>

        <Field.Field>
          <Field.Label for="oidcClientSecret">Client Secret *</Field.Label>
          <Input
            id="oidcClientSecret"
            type="password"
            bind:value={oidcClientSecret}
            placeholder="Enter client secret"
            class="w-full"
          />
          <Field.Description>Keep this secret secure. It will be encrypted at rest.</Field.Description>
        </Field.Field>

        <Field.Field>
          <Field.Label for="oidcScopes">Scopes</Field.Label>
          <Input
            id="oidcScopes"
            bind:value={oidcScopes}
            placeholder="openid profile email"
            class="w-full md:w-80"
          />
          <Field.Description>Space-separated list of OAuth scopes to request.</Field.Description>
        </Field.Field>
      </Field.Set>
    {:else}
      <!-- SAML Configuration -->
      <Field.Set>
        <Field.Legend>SAML 2.0 Configuration</Field.Legend>

        <Field.Field>
          <Field.Label for="samlMetadataXml">IdP Metadata XML (Optional)</Field.Label>
          <Textarea
            id="samlMetadataXml"
            bind:value={samlMetadataXml}
            placeholder="Paste your IdP metadata XML here to auto-fill configuration..."
            rows={4}
            class="w-full font-mono text-sm"
          />
          <Button variant="outline" size="sm" onclick={parseSamlMetadata} disabled={!samlMetadataXml || saving}>
            Parse Metadata
          </Button>
        </Field.Field>

        <Field.Field>
          <Field.Label for="samlIdpEntityId">IdP Entity ID *</Field.Label>
          <Input
            id="samlIdpEntityId"
            bind:value={samlIdpEntityId}
            placeholder="http://www.okta.com/exk1234567890"
            class="w-full"
          />
        </Field.Field>

        <Field.Field>
          <Field.Label for="samlIdpSsoUrl">IdP SSO URL *</Field.Label>
          <Input
            id="samlIdpSsoUrl"
            bind:value={samlIdpSsoUrl}
            placeholder="https://your-domain.okta.com/app/exk1234567890/sso/saml"
            class="w-full"
          />
        </Field.Field>

        <Field.Field>
          <Field.Label for="samlIdpCertificate">IdP Certificate</Field.Label>
          <Textarea
            id="samlIdpCertificate"
            bind:value={samlIdpCertificate}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            rows={4}
            class="w-full font-mono text-sm"
          />
        </Field.Field>
      </Field.Set>
    {/if}

    <Separator />

    <!-- Security Settings -->
    <Field.Set>
      <Field.Legend>Security Settings</Field.Legend>

      <Field.Field>
        <div class="flex items-center justify-between">
          <div>
            <Field.Label>Force SSO</Field.Label>
            <Field.Description>
              When enabled, users must use SSO to sign in. Email/password login will be disabled for this organization.
            </Field.Description>
          </div>
          <Switch bind:checked={forceSso} />
        </div>
      </Field.Field>

      <Field.Field>
        <div class="flex items-center justify-between">
          <div>
            <Field.Label>Auto-provision Users</Field.Label>
            <Field.Description>
              Automatically create user accounts on first SSO login. Disable to require pre-registration.
            </Field.Description>
          </div>
          <Switch bind:checked={autoProvisionUsers} />
        </div>
      </Field.Field>

      <Field.Field>
        <Field.Label for="allowedDomains">Allowed Email Domains</Field.Label>
        <Input
          id="allowedDomains"
          bind:value={allowedDomains}
          placeholder="company.com, subsidiary.com"
          class="w-full md:w-80"
        />
        <Field.Description>
          Comma-separated list of email domains allowed to sign in via SSO. Leave empty to allow all domains.
        </Field.Description>
      </Field.Field>
    </Field.Set>

    <Separator />

    <!-- Enable SSO -->
    <Field.Set>
      <Field.Legend>Enable SSO</Field.Legend>
      <Field.Field>
        <div class="flex items-center justify-between">
          <div>
            <Field.Label>SSO Status</Field.Label>
            <Field.Description>
              Enable SSO to allow users to sign in with your identity provider.
            </Field.Description>
          </div>
          <Switch bind:checked={ssoEnabled} />
        </div>
      </Field.Field>
    </Field.Set>

    <!-- Actions -->
    <div class="flex flex-wrap items-center gap-4 pt-4">
      <Button variant="default" onclick={saveSsoConfig} disabled={saving} loading={saving}>
        {hasExistingConfig ? 'Update Configuration' : 'Save Configuration'}
      </Button>

      {#if hasExistingConfig}
        <Button variant="destructive" onclick={deleteSsoConfig} disabled={saving}>
          Delete Configuration
        </Button>
      {/if}
    </div>

    <!-- Service Provider Info -->
    {#if hasExistingConfig}
      <Separator />

      <Field.Set>
        <Field.Legend>Service Provider Information</Field.Legend>
        <Field.Description>
          Use these values when configuring your identity provider.
        </Field.Description>

        <div class="bg-muted/50 space-y-2 rounded-md p-4 font-mono text-sm">
          <div>
            <span class="text-muted-foreground">Callback URL (ACS URL):</span>
            <br />
            <code class="select-all">{typeof window !== 'undefined' ? `${window.location.origin.replace('app.', 'api.')}/sso/callback` : '[API_URL]/sso/callback'}</code>
          </div>
          {#if providerType === 'saml'}
            <div>
              <span class="text-muted-foreground">SP Entity ID:</span>
              <br />
              <code class="select-all">{typeof window !== 'undefined' ? window.location.origin : '[DASHBOARD_URL]'}</code>
            </div>
          {:else}
            <div>
              <span class="text-muted-foreground">Redirect URI:</span>
              <br />
              <code class="select-all">{typeof window !== 'undefined' ? `${window.location.origin.replace('app.', 'api.')}/sso/callback` : '[API_URL]/sso/callback'}</code>
            </div>
          {/if}
        </div>
      </Field.Set>
    {/if}
  {/if}
</Field.Group>
