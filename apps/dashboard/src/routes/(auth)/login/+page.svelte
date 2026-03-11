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

  const emailFromUrl = page.url.searchParams.get('email') ?? '';

  let fields = $state(Object.assign({}, LOGIN_FIELDS, emailFromUrl ? { email: emailFromUrl } : {}));

  let submitError: string | undefined = $state();
  let loading = $state(false);
  let errors = $state(Object.assign({}, LOGIN_FIELDS));
  let isSSOInfoLoaded = $state(false);
  let orgSupportsSso = $state(false);

  // SSO state
  let ssoState = $state<{
    checking: boolean;
    required: boolean;
    available: boolean;
    redirectUrl: string | null;
    providerName: string | null;
    providerId: string | null;
  }>({
    checking: false,
    required: false,
    available: false,
    redirectUrl: null,
    providerName: null,
    providerId: null
  });

  const redirectUrl = $derived(page.url.searchParams.get('redirect'));

  const hideGoogleAuth = $derived(!!($globalStore.isOrgSite && $currentOrg.disableGoogleAuth));

  async function initSSOInfo() {
    if (isSSOInfoLoaded || !$currentOrg.id) return;

    isSSOInfoLoaded = true;

    const ssoInfo = await ssoApi.getOrgSsoInfo($currentOrg.id);
    console.log('ssoInfo', ssoInfo);

    if (ssoInfo) {
      orgSupportsSso = ssoInfo.hasSso;
      ssoState = {
        checking: false,
        required: ssoInfo.ssoRequired,
        available: ssoInfo.hasSso,
        redirectUrl: ssoInfo.redirectUrl,
        providerName: ssoInfo.providerName,
        providerId: ssoInfo.providerId
      };
    }
  }

  $effect(() => {
    initSSOInfo();
  });

  let emailCheckTimeout: ReturnType<typeof setTimeout>;
  function handleEmailChange() {
    errors.email = '';
    if (!orgSupportsSso) return;

    clearTimeout(emailCheckTimeout);

    emailCheckTimeout = setTimeout(async () => {
      if (!fields.email || !fields.email.includes('@')) {
        ssoState = {
          checking: false,
          required: false,
          available: false,
          redirectUrl: null,
          providerName: null,
          providerId: null
        };
        return;
      }

      ssoState.checking = true;
      const result = await ssoApi.discoverSso(fields.email);
      ssoState.checking = false;

      if (result) {
        ssoState = {
          checking: false,
          required: result.ssoRequired,
          available: result.ssoAvailable,
          redirectUrl: result.redirectUrl,
          providerName: result.providerName,
          providerId: result.providerId
        };
      }
    }, 500);
  }

  async function handleSsoLogin() {
    const url = `${window.location.origin}${ssoState.redirectUrl || ''}`;

    const res = await authClient.signIn.sso({
      email: fields.email,
      providerId: ssoState.providerId || '',
      callbackURL: url
    });

    console.log('res', res);
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

<AuthUI isLogin={true} {handleSubmit} isLoading={loading} {hideGoogleAuth}>
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
          disabled={loading}
          autofocus
          aria-invalid={errors.email ? 'true' : undefined}
          autocomplete="username"
        />
        {#if errors.email}
          <Field.Error>{$t(errors.email)}</Field.Error>
        {/if}
      </Field.Content>
    </Field.Field>

    <!-- SSO Section (when SSO is available) -->
    {#if ssoState.available}
      <div
        class="ui:p-4 ui:bg-blue-50 ui:dark:bg-blue-900/20 ui:rounded-lg ui:border ui:border-blue-200 ui:dark:border-blue-800"
      >
        <div class="ui:flex ui:items-center ui:gap-3">
          <ShieldIcon class="ui:size-5 ui:text-blue-600" />
          <div class="ui:flex-1">
            <p class="ui:font-medium ui:text-sm">
              {$t('settings.auth.login.sso_enabled', { provider: ssoState.providerName || 'SSO' })}
            </p>
            {#if ssoState.required}
              <p class="ui:text-xs ui:text-blue-600 ui:mt-1">
                {$t('settings.auth.login.sso_required')}
              </p>
            {/if}
          </div>
        </div>
        <Button type="button" variant="default" class="ui:w-full ui:mt-3" onclick={handleSsoLogin}>
          {$t('settings.auth.login.sign_in_with_sso', { provider: ssoState.providerName || 'SSO' })}
        </Button>
      </div>
    {/if}

    <!-- Divider when both SSO and password login are available -->
    {#if ssoState.available && !ssoState.required && !($globalStore.isOrgSite && $currentOrg.disableEmailPassword)}
      <div class="ui:relative ui:my-4">
        <div class="ui:absolute ui:inset-0 ui:flex ui:items-center" aria-hidden="true">
          <div class="ui:w-full ui:border-t ui:border-border"></div>
        </div>
        <div class="ui:relative ui:flex ui:justify-center ui:text-xs">
          <span class="ui:bg-card ui:px-2 ui:text-muted-foreground">
            {$t('settings.auth.login.or_continue_with')}
          </span>
        </div>
      </div>
    {/if}

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
