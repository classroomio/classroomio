<script lang="ts">
  import { untrack } from 'svelte';
  import { AuthUI } from '$features/ui';
  import SenjaEmbed from '$lib/components/Senja/Embed.svelte';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import { t } from '$lib/utils/functions/translations';
  import { authValidation, getConfirmPasswordError, getDisableSubmit } from '$lib/utils/functions/validator';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { authClient } from '$lib/utils/services/auth/client';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Password } from '@cio/ui/custom/password';
  import { Button } from '@cio/ui/base/button';

  let fields = $state(Object.assign({}, SIGNUP_FIELDS));
  let loading = $state(false);
  let errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = $state({});
  let submitError: string = $state('');

  const disableSubmit = $derived(getDisableSubmit(fields));

  async function handleSubmit() {
    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;
      const name = fields.email.split('@')[0];

      const { error } = await authClient.signUp.email(
        {
          email: fields.email,
          password: fields.password,
          name: name
        },
        {
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

            window.location.href = '/';
          }
        }
      );

      if (error) throw error;
    } catch (error: any) {
      submitError = error?.error_description || error?.message;
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

<AuthUI isLogin={false} {handleSubmit} isLoading={loading}>
  <div class="ui:flex ui:flex-col ui:gap-6">
    <Field.Field>
      <Field.Label for="email">{$t('login.fields.email')}</Field.Label>
      <Field.Content>
        <Input
          id="email"
          type="email"
          bind:value={fields.email}
          placeholder="you@domain.com"
          disabled={loading}
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
