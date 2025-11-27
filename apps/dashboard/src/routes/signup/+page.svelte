<script lang="ts">
  import { untrack } from 'svelte';
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import SenjaEmbed from '$lib/components/Senja/Embed.svelte';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { authValidation, getConfirmPasswordError, getDisableSubmit } from '$lib/utils/functions/validator';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import { authClient } from '$lib/utils/services/auth/client';

  let supabase = getSupabase();
  let fields = $state(Object.assign({}, SIGNUP_FIELDS));
  let loading = $state(false);
  let errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = $state({});
  let submitError: string = $state('');
  let formRef: HTMLFormElement | undefined = $state();

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

<AuthUI {supabase} isLogin={false} {handleSubmit} isLoading={loading} bind:formRef>
  <div class="mt-4 w-full">
    <p class="mb-6 text-lg font-semibold dark:text-white">Create a free account</p>
    <!-- <TextField
      label="Full Name"
      bind:value={fields.name}
      type="text"
      autoFocus={true}
      placeholder="e.g Joke Silva"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={errors.name}
      isRequired
    /> -->
    <TextField
      label={$t('login.fields.email')}
      bind:value={fields.email}
      type="email"
      placeholder="you@domain.com"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={$t(errors.email ?? '')}
      isRequired
    />
    <TextField
      label={$t('login.fields.password')}
      bind:value={fields.password}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={$t(errors.password ?? '')}
      helperMessage={$t('login.fields.password_helper_message')}
      isRequired
    />
    <TextField
      label={$t('login.fields.confirm_password')}
      bind:value={fields.confirmPassword}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={errors.confirmPassword}
      isRequired
    />
    {#if submitError}
      <p class="text-sm text-red-500">{submitError}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full items-center justify-end">
    <PrimaryButton
      label={$t('login.create_account')}
      type="submit"
      className="sm:w-full w-full"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
