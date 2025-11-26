<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { getConfirmPasswordError } from '$lib/utils/functions/validator';
  import { AuthUI } from '$lib/features/ui';
  import { resetApi } from '$lib/features/auth/api/reset.svelte';
  import type { TResetPasswordForm } from '$lib/features/auth/utils/types';
  import { snackbar } from '$lib/components/Snackbar/store';

  let fields: TResetPasswordForm = $state({
    password: '',
    confirmPassword: '',
    token: ''
  });

  const isSubmitDisabled = $derived!!(
    fields.password && fields.confirmPassword && fields.password !== fields.confirmPassword
  );
  const token = $derived(new URLSearchParams(page.url.search).get('token'));

  onMount(() => {
    if (token) return;

    snackbar.error('Invalid Token');

    setTimeout(() => {
      goto(resolve('/login', {}));
    }, 2000);
  });

  function setConfirmPasswordError(fields: TResetPasswordForm) {
    untrack(() => {
      const errors = { ...resetApi.errors };
      errors.confirmPassword = getConfirmPasswordError(fields) ?? '';
      resetApi.setError(errors);
    });
  }

  $effect(() => {
    setConfirmPasswordError(fields);
  });
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
  <div class="mt-4 w-full">
    <h3 class="my-3 text-xl font-semibold dark:text-white">New Password</h3>
    <p class="mb-6 text-sm dark:text-white">Enter your new password details</p>
    <TextField
      label="Your Password"
      bind:value={fields.password}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={resetApi.isLoading}
      errorMessage={resetApi.errors.password}
      helperMessage="Password must be more than 8 characters"
      isRequired
    />
    <TextField
      label="Confirm Password"
      bind:value={fields.confirmPassword}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={resetApi.isLoading}
      errorMessage={resetApi.errors.confirmPassword}
      isRequired
    />
  </div>

  <div class="my-4 flex w-full items-center justify-end">
    <PrimaryButton
      label="Reset Password"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={isSubmitDisabled || resetApi.isLoading}
      isLoading={resetApi.isLoading}
    />
  </div>
</AuthUI>
