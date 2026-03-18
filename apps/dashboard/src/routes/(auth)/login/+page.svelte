<script lang="ts">
  import { AuthUI } from '$features/ui';
  import { LOGIN_FIELDS } from '$lib/utils/constants/authentication';
  import { t } from '$lib/utils/functions/translations';
  import { authValidation } from '$lib/utils/functions/validator';
  import { currentOrg } from '$lib/utils/store/org';
  import { authClient } from '$lib/utils/services/auth/client';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Password } from '@cio/ui/custom/password';
  import { Button } from '@cio/ui/base/button';
  import { ssoApi } from '$features/org/api/sso.svelte';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import { buildSsoRedirectUrl, createSsoEmailChecker, type SsoAuthState } from '$features/auth/utils/auth-sso';
  import { authSsoStore, ensureSsoInfoLoaded } from '$features/auth/utils/auth-sso-store';

  const emailFromUrl = page.url.searchParams.get('email') ?? '';
  const isEmailPrefilled = !!emailFromUrl;

  let fields = $state(Object.assign({}, LOGIN_FIELDS, emailFromUrl ? { email: emailFromUrl } : {}));

  let submitError: string | undefined = $state();
  let loading = $state(false);
  let errors = $state(Object.assign({}, LOGIN_FIELDS));
  /** Per-email discovery result; display uses this over org-level when set */
  let discoveryState = $state<SsoAuthState | null>(null);

  const redirectUrl = $derived(page.url.searchParams.get('redirect'));

  const hideGoogleAuth = $derived(!!($globalStore.isOrgSite && $currentOrg.disableGoogleAuth));

  const ssoState = $derived(discoveryState ?? $authSsoStore.ssoState);
  const orgSupportsSso = $derived($authSsoStore.orgSupportsSso);

  $effect(() => {
    const orgId = $currentOrg.id;
    if (orgId) ensureSsoInfoLoaded(orgId, (id) => ssoApi.getOrgSsoInfo(id));
  });

  const handleEmailChange = createSsoEmailChecker({
    getEmail: () => fields.email,
    getOrgSupportsSso: () => orgSupportsSso,
    discoverSso: (email) => ssoApi.discoverSso(email),
    onChecking: () => {
      discoveryState = { ...$authSsoStore.ssoState, checking: true };
    },
    onResult: (state) => {
      discoveryState = state;
    },
    onClear: () => {
      errors.email = '';
      discoveryState = null;
    }
  });

  async function handleSsoLogin() {
    const url = buildSsoRedirectUrl(ssoState.redirectUrl);

    await authClient.signIn.sso({
      email: fields.email,
      providerId: ssoState.providerId || '',
      callbackURL: url
    });
  }

  async function handleSubmit() {
    if (ssoState.required && ssoState.available) {
      handleSsoLogin();
      return;
    }

    if ($globalStore.isOrgSite && $currentOrg.disableEmailPassword) {
      submitError = t.get('settings.auth.login.email_password_disabled');
      return;
    }

    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;

      const { data, error } = await authClient.signIn.email(
        {
          email: fields.email,
          password: fields.password
        },
        {
          onSuccess: () => {
            capturePosthogEvent('login', {
              email: fields.email
            });

            if ($globalStore.isOrgSite) {
              capturePosthogEvent('student_login', {
                email: fields.email
              });
            }

            const redirect = redirectUrl || '/';
            window.location.href = redirect.startsWith('/') ? redirect : `/?redirect=${encodeURIComponent(redirect)}`;
          }
        }
      );

      console.log('data', data);

      if (error) throw error;
    } catch (error) {
      const err = error as { error_description?: string; message?: string };
      submitError = err?.error_description ?? err?.message ?? '';
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Welcome back to {$currentOrg.name || 'ClassroomIO'}</title>
</svelte:head>

{#snippet getPasswordAuthAlternative()}
  <!-- SSO Section (when SSO is available) -->
  <div class="space-y-3">
    {#if ssoState.required}
      <div class="flex items-center gap-3">
        <ShieldIcon class="size-5 text-blue-600" />
        <div class="flex-1">
          <p class="mt-1 text-xs text-blue-600">
            {$t('settings.auth.login.sso_required')}
          </p>
        </div>
      </div>
    {/if}
    <Button type="button" variant="outline" class="w-full" onclick={handleSsoLogin}>
      {$t('settings.auth.login.sign_in_with_sso', { provider: ssoState.providerName || 'SSO' })}
    </Button>
  </div>
{/snippet}

<AuthUI
  isLogin={true}
  {handleSubmit}
  isLoading={loading}
  {hideGoogleAuth}
  getPasswordAuthAlternative={ssoState.available ? getPasswordAuthAlternative : undefined}
>
  <div class="ui:flex ui:flex-col ui:gap-6">
    <Field.Field>
      <Field.Label for="email">{$t('login.email')}</Field.Label>
      <Field.Content>
        <Input
          id="email"
          type="email"
          bind:value={fields.email}
          oninput={handleEmailChange}
          placeholder="you@domain.com"
          disabled={loading || isEmailPrefilled}
          readonly={isEmailPrefilled}
          autofocus
          aria-invalid={errors.email ? 'true' : undefined}
          autocomplete="username"
        />
        {#if errors.email}
          <Field.Error>{$t(errors.email)}</Field.Error>
        {/if}
      </Field.Content>
    </Field.Field>

    <!-- Password Section (when not force SSO and email/password not disabled) -->
    {#if !ssoState.required && !($globalStore.isOrgSite && $currentOrg.disableEmailPassword)}
      <Field.Field>
        <div class="ui:flex ui:items-center ui:justify-between">
          <Field.Label for="password">{$t('login.password')}</Field.Label>
          <a class="ui:text-sm ui:text-primary ui:hover:underline" href={resolve('/forgot', {})}>
            {$t('login.forgot')}
          </a>
        </div>
        <Field.Content>
          <Password
            id="password"
            bind:value={fields.password}
            placeholder="************"
            disabled={loading}
            aria-invalid={errors.password ? 'true' : undefined}
            autocomplete="current-password"
          />
          {#if errors.password}
            <Field.Error>{$t(errors.password)}</Field.Error>
          {/if}
        </Field.Content>
      </Field.Field>

      {#if submitError}
        <p class="ui:text-sm ui:text-destructive">{submitError}</p>
      {/if}

      <Button type="submit" disabled={loading} {loading} class="ui:w-full">
        {$t('login.login')}
      </Button>
    {:else if $globalStore.isOrgSite && $currentOrg.disableEmailPassword && !ssoState.available}
      <div
        class="ui:p-4 ui:bg-amber-50 ui:dark:bg-amber-900/20 ui:rounded-lg ui:border ui:border-amber-200 ui:dark:border-amber-800"
      >
        <p class="ui:text-sm ui:text-amber-800 ui:dark:text-amber-200">
          {$t('settings.auth.login.email_password_disabled_message')}
        </p>
      </div>
    {/if}
  </div>
</AuthUI>
