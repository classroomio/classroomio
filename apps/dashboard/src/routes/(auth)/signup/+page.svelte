<script lang="ts">
  import { untrack } from 'svelte';
  import { AuthUI, SenjaEmbed } from '$features/ui';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import { t } from '$lib/utils/functions/translations';
  import { authValidation, getConfirmPasswordError, getDisableSubmit } from '$lib/utils/functions/validator';
  import { page } from '$app/state';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { authClient } from '$lib/utils/services/auth/client';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Password } from '@cio/ui/custom/password';
  import { Button } from '@cio/ui/base/button';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

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

  const disableSubmit = $derived(getDisableSubmit(fields));
  const redirectUrl = $derived(page.url.searchParams.get('redirect'));
  const inviteToken = $derived(page.url.searchParams.get('invite_token'));

  // Use org from store or layout data (layout data ensures org is available on self-hosted before store is set)
  const org = $derived($currentOrg?.id ? $currentOrg : (data.org ?? $currentOrg));

  // Invite context: allow signup when invite_token present or redirect contains invite info
  const hasInviteContext = $derived(
    !!inviteToken || (!!redirectUrl && (redirectUrl.includes('/invite/t/') || redirectUrl.includes('invite_token')))
  );

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

  async function handleSubmit() {
    if (signupRestricted) {
      submitError = t.get('settings.auth.login.signup_disabled_error');
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

            const redirect = redirectUrl || '/';
            window.location.href = redirect.startsWith('/') ? redirect : `/?redirect=${encodeURIComponent(redirect)}`;
          }
        }
      );

      if (error) throw error;
    } catch (error) {
      submitError =
        (error as { error_description?: string; message?: string })?.error_description ||
        (error as { message?: string })?.message ||
        '';
      loading = false;
    }
  }

  function setConfirmPasswordError(fields: typeof SIGNUP_FIELDS) {
    untrack(() => {
      errors.confirmPassword = getConfirmPasswordError(fields);
    });
  }

  $effect(() => {
    setConfirmPasswordError(fields);
  });
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<SenjaEmbed id="aa054658-1e15-4d00-8920-91f424326c4e" />

{#if signupRestricted}
  <div
    class="ui:p-6 ui:bg-amber-50 ui:dark:bg-amber-900/20 ui:rounded-lg ui:border ui:border-amber-200 ui:dark:border-amber-800 ui:text-center"
  >
    <h2 class="ui:text-lg ui:font-semibold ui:text-amber-800 ui:dark:text-amber-200">
      {$t('login.signup_disabled.title')}
    </h2>
    <p class="ui:mt-2 ui:text-sm ui:text-amber-700 ui:dark:text-amber-300">
      {org.disableSignupMessage ||
        (inviteOnly
          ? $t('login.signup_disabled.invite_only_message')
          : $t('settings.auth.login.signup_disabled_error'))}
    </p>
    <Button variant="outline" class="ui:mt-4" onclick={() => goto(resolve('/login', {}))}>
      {$t('login.signup_disabled.go_to_login')}
    </Button>
  </div>
{:else}
  <AuthUI isLogin={false} {handleSubmit} isLoading={loading} {hideGoogleAuth}>
    <div class="ui:flex ui:flex-col ui:gap-6">
      <Field.Field>
        <Field.Label for="email">{$t('login.fields.email')}</Field.Label>
        <Field.Content>
          <Input
            id="email"
            type="email"
            bind:value={fields.email}
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

      <Field.Field>
        <Field.Label for="password">{$t('login.fields.password')}</Field.Label>
        <Field.Content>
          <Password
            id="password"
            bind:value={fields.password}
            placeholder="************"
            disabled={loading}
            aria-invalid={errors.password ? 'true' : undefined}
            autocomplete="new-password"
          />
          {#if errors.password}
            <Field.Error>{$t(errors.password)}</Field.Error>
          {/if}
          <Field.Description>{$t('login.fields.password_helper_message')}</Field.Description>
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
            aria-invalid={errors.confirmPassword ? 'true' : undefined}
            autocomplete="new-password"
          />
          {#if errors.confirmPassword}
            <Field.Error>{errors.confirmPassword}</Field.Error>
          {/if}
        </Field.Content>
      </Field.Field>

      {#if submitError}
        <p class="ui:text-sm ui:text-destructive">{submitError}</p>
      {/if}

      <Button type="submit" disabled={disableSubmit || loading} {loading} class="ui:w-full">
        {$t('login.create_account')}
      </Button>
    </div>
  </AuthUI>
{/if}
