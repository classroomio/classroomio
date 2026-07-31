<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { getConfirmPasswordError, getDisableSubmit } from '$lib/utils/functions/validator';
  import { t } from '$lib/utils/functions/translations';
  import { AuthUI } from '$features/ui';
  import { resetApi } from '$features/auth/api/reset.svelte';
  import type { TResetPasswordForm } from '$features/auth/utils/types';
  import { snackbar } from '$features/ui/snackbar/store';
  import * as Field from '@cio/ui/base/field';
  import { Password } from '@cio/ui/custom/password';
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';

  let fields: TResetPasswordForm = $state({
    password: '',
    confirmPassword: '',
    token: ''
  });

  const isSubmitDisabled = $derived(getDisableSubmit(fields));
  const token = $derived(new URLSearchParams(page.url.search).get('token'));

  onMount(() => {
    if (token) return;

    snackbar.error('Invalid Token');

    setTimeout(() => {
      goto(resolve('/login', {}));
    }, 2000);
  });

  const confirmPasswordError = $derived(getConfirmPasswordError(fields));
</script>

<svelte:head>
  <title>Reset Password - ClassroomIO</title>
</svelte:head>

<AuthUI
  isLogin={false}
  handleSubmit={() => resetApi.submit({ ...fields, token: token ?? '' })}
  showOnlyContent={true}
  isLoading={resetApi.isLoading}
  showLogo={true}
>
  <div class="ui:flex ui:flex-col ui:gap-6">
    <div>
      <Card.Title class="ui:text-xl">{$t('login.reset_password.heading')}</Card.Title>
      <Card.Description class="ui:mt-2">{$t('login.reset_password.description')}</Card.Description>
    </div>
    <Field.Field>
      <Field.Label for="password">{$t('login.fields.password')}</Field.Label>
      <Field.Content>
        <Password
          id="password"
          bind:value={fields.password}
          placeholder="************"
          disabled={resetApi.isLoading}
          aria-invalid={resetApi.errors.password ? 'true' : undefined}
          autocomplete="new-password"
        />
        {#if resetApi.errors.password}
          <Field.Error>{resetApi.errors.password}</Field.Error>
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
          disabled={resetApi.isLoading}
          aria-invalid={confirmPasswordError || resetApi.errors.confirmPassword ? 'true' : undefined}
          autocomplete="new-password"
        />
        {#if confirmPasswordError || resetApi.errors.confirmPassword}
          <Field.Error>{confirmPasswordError || resetApi.errors.confirmPassword}</Field.Error>
        {/if}
      </Field.Content>
    </Field.Field>

    <Button
      type="submit"
      disabled={isSubmitDisabled || resetApi.isLoading}
      loading={resetApi.isLoading}
      class="ui:w-full"
    >
      Reset Password
    </Button>
  </div>
</AuthUI>
