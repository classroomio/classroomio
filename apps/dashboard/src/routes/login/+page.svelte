<script lang="ts">
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { LOGIN_FIELDS } from '$lib/utils/constants/authentication';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { authValidation } from '$lib/utils/functions/validator';
  // import { capturePosthogEvent } from '$lib/utils/services/posthog';
  // import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { authClient } from '$lib/utils/services/auth/client';

  let formRef: HTMLFormElement | undefined = $state();
  let supabase = getSupabase();
  let fields = $state(Object.assign({}, LOGIN_FIELDS));
  let submitError: string | undefined = $state();
  let loading = $state(false);
  let errors = $state(Object.assign({}, LOGIN_FIELDS));

  async function handleSubmit() {
    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;

      const data = await authClient.signIn.email({
        email: fields.email,
        password: fields.password
      });

      console.log('data', data);

      // if (error) throw error;

      // capturePosthogEvent('login', {
      //   email: fields.email
      // });

      // if ($globalStore.isOrgSite) {
      //   capturePosthogEvent('student_login', {
      //     email: fields.email
      //   });
      // }
    } catch (error: any) {
      submitError = error.error_description || error.message;
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Welcome back to {$currentOrg.name || 'ClassroomIO'}</title>
</svelte:head>

<AuthUI {supabase} isLogin={true} {handleSubmit} isLoading={loading} bind:formRef>
  <div class="mt-4 w-full">
    <p class="mb-6 text-lg font-semibold dark:text-white">{$t('login.welcome')}</p>
    <TextField
      label={$t('login.email')}
      bind:value={fields.email}
      type="email"
      autoFocus={true}
      placeholder="you@domain.com"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={$t(errors.email)}
    />
    <TextField
      label={$t('login.password')}
      bind:value={fields.password}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={$t(errors.password)}
    />
    {#if submitError}
      <p class="text-sm text-red-500">{submitError}</p>
    {/if}
    <div class="w-full text-right">
      <a class="text-md text-primary-700" href="/forgot"> {$t('login.forgot')} </a>
    </div>
  </div>

  <div class="my-4 flex w-full items-center justify-end">
    <!-- <a href="/login" class="text-primary-700 text-sm">Create an account</a> -->
    <PrimaryButton
      label={$t('login.login')}
      type="submit"
      className="sm:w-full w-full"
      isDisabled={loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
