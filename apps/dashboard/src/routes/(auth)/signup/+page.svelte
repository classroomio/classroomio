<script lang="ts">
  import { AuthUI, SenjaEmbed } from '$features/ui';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import { t } from '$lib/utils/functions/translations';
  import { authValidation, getConfirmPasswordError, getDisableSubmit } from '$lib/utils/functions/validator';
  import { PASSWORD_MIN_LENGTH } from '@cio/utils/validation/auth/password';
  import { page } from '$app/state';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { authClient } from '$lib/utils/services/auth/client';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Password } from '@cio/ui/custom/password';
  import { Button } from '@cio/ui/base/button';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ssoApi } from '$features/org/api/sso.svelte';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import { buildSsoRedirectUrl, createSsoEmailChecker, type SsoAuthState } from '$features/auth/utils/auth-sso';
  import { authSsoStore, ensureSsoInfoLoaded } from '$features/auth/utils/auth-sso-store';
  import { orgApi } from '$features/org/api/org.svelte';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  let { data } = $props();
  const emailFromUrl = page.url.searchParams.get('email') ?? '';
  const isEmailPrefilled = !!emailFromUrl;
  let fields = $state(Object.assign({}, SIGNUP_FIELDS, emailFromUrl ? { email: emailFromUrl } : {}));
  let loading = $state(false);
  let errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = $state({});
  let submitError: string = $state('');

  /** Per-email discovery result; display uses this over org-level when set */
  let discoveryState = $state<SsoAuthState | null>(null);

  const disableSubmit = $derived(getDisableSubmit(fields));
  const redirectUrl = $derived(page.url.searchParams.get('redirect'));
  const inviteToken = $derived(page.url.searchParams.get('invite_token'));

  // Use org from store or layout data (layout data ensures org is available on self-hosted before store is set)
  const org = $derived($currentOrg?.id ? $currentOrg : (data.org ?? $currentOrg));

  const ssoState = $derived(discoveryState ?? $authSsoStore.ssoState);
  const orgSupportsSso = $derived($authSsoStore.orgSupportsSso);

  // Invite context: allow signup when invite_token present or redirect contains invite info
  const hasInviteContext = $derived(
    !!inviteToken || (!!redirectUrl && (redirectUrl.includes('/invite/') || redirectUrl.includes('invite_token')))
  );
  const isNormalOrgSiteSignup = $derived(
    PUBLIC_IS_SELFHOSTED !== 'true' && $globalStore.isOrgSite && !!org.id && !hasInviteContext
  );
  const newUserCallbackPathname = $derived.by(() => {
    if (!isNormalOrgSiteSignup) {
      return undefined;
    }

    return redirectUrl ? `/join-academy?redirect=${encodeURIComponent(redirectUrl)}` : '/join-academy';
  });

  const inviteOnly = $derived(!!org?.settings?.signup?.inviteOnly);
  const signupRestricted = $derived($globalStore.isOrgSite && (org.disableSignup || (inviteOnly && !hasInviteContext)));

  // Hide Google Auth if disabled for org
  const hideGoogleAuth = $derived(!!($globalStore.isOrgSite && org.disableGoogleAuth));

  // Check if signup is disabled
  onMount(() => {
    if ($globalStore.isOrgSite && org.disableSignup) {
      goto(resolve('/login?error=signup_disabled', {}));
    }
  });

  $effect(() => {
    const orgId = org?.id;
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
    if (signupRestricted) {
      submitError = t.get('settings.auth.login.signup_disabled_error');
      return;
    }

    if (ssoState.required && ssoState.available) {
      handleSsoLogin();
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
      const name = fields.email.split('@')[0];

      // if in selfhosted instance always pass org id
      // if in cloud instance, ONLY pass when on subdomain i.e student experience
      const headers = $globalStore.isOrgSite ? { 'cio-org-id': org.id } : undefined;

      const { error } = await authClient.signUp.email(
        {
          email: fields.email,
          password: fields.password,
          name: name
        },
        {
          headers,
          onSuccess: (ctx) => {
            console.log('Signup successful');
            capturePosthogEvent('user_signed_up', {
              distinct_id: ctx.data.user.id || '',
              email: ctx.data.user.email,
              username: name
            });

            if ($globalStore.isOrgSite) {
              capturePosthogEvent('student_signed_up', {
                distinct_id: ctx.data.user.id || '',
                email: ctx.data.user.email,
                username: name
              });
            }
          }
        }
      );

      if (error) {
        throw error;
      }

      if (isNormalOrgSiteSignup) {
        const joinResult = await orgApi.joinAcademy(org.id, redirectUrl || '/lms');
        const joinRetryPathname = newUserCallbackPathname;

        if (!joinResult && joinRetryPathname) {
          await goto(resolve(joinRetryPathname, {}));
        }

        return;
      }

      const redirect = redirectUrl || '/';
      window.location.href = redirect.startsWith('/') ? redirect : `/?redirect=${encodeURIComponent(redirect)}`;
    } catch (error) {
      submitError =
        (error as { error_description?: string; message?: string })?.error_description ||
        (error as { message?: string })?.message ||
        '';
      loading = false;
    }
  }

  let passwordHasBlurred = $state(false);

  function handlePasswordBlur() {
    passwordHasBlurred = true;
    validatePasswordLength();
  }

  function handlePasswordInput() {
    if (passwordHasBlurred) {
      validatePasswordLength();
    }
  }

  function validatePasswordLength() {
    if (fields.password && fields.password.length < PASSWORD_MIN_LENGTH) {
      errors.password = 'validations.auth.password.min_char';
    } else {
      errors.password = '';
    }
  }

  const confirmPasswordError = $derived(getConfirmPasswordError(fields));
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

{#if !$globalStore.isOrgSite || $isFreePlan}
  <SenjaEmbed id="aa054658-1e15-4d00-8920-91f424326c4e" />
{/if}

{#if signupRestricted}
  <div
    class="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20"
  >
    <h2 class="text-lg font-semibold text-amber-800 dark:text-amber-200">
      {$t('login.signup_disabled.title')}
    </h2>
    <p class="mt-2 text-sm text-amber-700 dark:text-amber-300">
      {org.disableSignupMessage ||
        (inviteOnly
          ? $t('login.signup_disabled.invite_only_message')
          : $t('settings.auth.login.signup_disabled_error'))}
    </p>
    <Button variant="outline" class="mt-4" onclick={() => goto(resolve('/login', {}))}>
      {$t('login.signup_disabled.go_to_login')}
    </Button>
  </div>
{:else}
  {#snippet getPasswordAuthAlternative()}
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
    isLogin={false}
    {handleSubmit}
    isLoading={loading}
    {hideGoogleAuth}
    {newUserCallbackPathname}
    getPasswordAuthAlternative={ssoState.available ? getPasswordAuthAlternative : undefined}
  >
    <div class="flex flex-col gap-6">
      <Field.Field>
        <Field.Label for="email">{$t('login.fields.email')}</Field.Label>
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
            autocomplete="email"
          />
          {#if errors.email}
            <Field.Error>{$t(errors.email)}</Field.Error>
          {/if}
        </Field.Content>
      </Field.Field>

      {#if !ssoState.required}
        <Field.Field>
          <Field.Label for="password">{$t('login.fields.password')}</Field.Label>
          <Field.Content>
            <Password
              id="password"
              bind:value={fields.password}
              placeholder="************"
              disabled={loading}
              onblur={handlePasswordBlur}
              oninput={handlePasswordInput}
              aria-invalid={errors.password ? 'true' : undefined}
              autocomplete="new-password"
            />
            {#if errors.password}
              <Field.Error>{$t(errors.password)}</Field.Error>
            {:else}
              <Field.Description>{$t('login.fields.password_helper_message')}</Field.Description>
            {/if}
          </Field.Content>
        </Field.Field>

        <Field.Field>
          <Field.Label for="confirmPassword">{$t('login.fields.confirm_password')}</Field.Label>
          <Field.Content>
            <Password
              id="confirmPassword"
              bind:value={fields.confirmPassword}
              placeholder="************"
              disabled={loading}
              aria-invalid={confirmPasswordError ? 'true' : undefined}
              autocomplete="new-password"
            />
            {#if confirmPasswordError}
              <Field.Error>{confirmPasswordError}</Field.Error>
            {/if}
          </Field.Content>
        </Field.Field>

        {#if submitError}
          <p class="ui:text-destructive text-sm">{submitError}</p>
        {/if}

        <Button type="submit" disabled={disableSubmit || loading} {loading} class="w-full">
          {$t('login.create_account')}
        </Button>
      {/if}
    </div>
  </AuthUI>
{/if}
