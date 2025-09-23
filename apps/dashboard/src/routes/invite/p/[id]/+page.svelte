<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import type { Profile } from '$lib/components/Course/components/People/types';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import { logout } from '$lib/utils/functions/logout';
  import { getSupabase, getAccessToken } from '$lib/utils/functions/supabase';
  import { setTheme } from '$lib/utils/functions/theme';
  import { t } from '$lib/utils/functions/translations';
  import {
    authValidation,
    getConfirmPasswordError,
    getDisableSubmit
  } from '$lib/utils/functions/validator';
  import { currentOrg } from '$lib/utils/store/org';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import { onMount } from 'svelte';

  export let data;

  let supabase = getSupabase();
  let fields = Object.assign({}, SIGNUP_FIELDS);
  let loading = false;

  let errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  let submitError: string;
  let disableSubmit = false;
  let formRef: HTMLFormElement;

  async function handleSubmit() {
    const validationRes = authValidation({
      ...fields,
      email: 'test@gmail.com' // validation for this ema
    });
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;
      let profile: Profile | null = data.profile;

      if (!data.profile) {
        // Signup
        const { data: signupData, error } = await supabase.auth.signUp({
          email: data.invite.email,
          password: fields.password
        });

        console.log('Signup', signupData);
        if (error) throw error;

        if (!signupData.user) {
          throw $t('login.validation.user_cannot_be_created');
        }

        // Insert profile
        const userId = signupData.user.id;
        const profileRes = await supabase
          .from('profile')
          .insert({
            id: userId,
            username: fields.name.toLowerCase().replace(' ', '-') + new Date().getTime(),
            fullname: fields.name,
            email: data.invite.email
          })
          .select();

        console.log('Insert profile', profileRes.data);

        if (profileRes.error) {
          throw profileRes.error;
        }

        profile = profileRes.data[0] || {};
      }

      if (!profile?.id) {
        throw $t('login.validation.unable_to_create_profile');
      }

      const res = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: fields.password
      });

      if (res.error) {
        throw res.error;
      }

      const accessToken = await getAccessToken();

      const inviteReq = await fetch('/invite/p/' + data.invite.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          profileId: profile.id
        })
      });

      const inviteRes = await inviteReq.json();

      console.log('inviteRes', inviteRes);

      if (!inviteRes.success) {
        throw new Error('Unable to accept invite');
      }

      formRef?.reset();

      return goto('/lms');
    } catch (error) {
      if (error instanceof Error) {
        submitError = error.message;
      } else {
        submitError = error?.toString() || '';
      }
    } finally {
      loading = false;
    }
  }

  function setCurOrg(cOrg: CurrentOrg) {
    if (!cOrg) return;

    console.log(cOrg);
    currentOrg.set(cOrg);
  }

  onMount(async () => {
    await logout(false);

    setTheme(data.org?.theme || '');

    setCurOrg(data.org as CurrentOrg);
  });

  $: errors.confirmPassword = getConfirmPasswordError(fields);
  $: disableSubmit = getDisableSubmit(fields);

  $: console.log('data', data.invite);
</script>

<svelte:head>
  <title>Access your products on BellCurve</title>
</svelte:head>

<AuthUI {supabase} isLogin={false} {handleSubmit} isLoading={loading} showLogo={true} bind:formRef>
  <div class="mt-4 w-full">
    {#if data.invite.accepted_at}
      <p class="mb-6 text-lg font-semibold dark:text-white">
        You have already accepted this invite
      </p>
    {:else}
      <p class="mb-6 text-lg font-semibold dark:text-white">
        {#if data.profile}
          Login to access your products
        {:else}
          Create an account to access your products
        {/if}
      </p>
      <TextField
        label={$t('login.fields.email')}
        value={data.invite.email}
        type="email"
        placeholder="you@domain.com"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={true}
      />
      {#if !data.profile}
        <TextField
          label={$t('login.fields.full_name')}
          bind:value={fields.name}
          type="text"
          autoFocus={true}
          placeholder="e.g Joke Silva"
          className="mb-6"
          inputClassName="w-full"
          isDisabled={loading}
          errorMessage={errors.name}
          isRequired
        />
      {/if}
      <TextField
        label={$t('login.fields.password')}
        bind:value={fields.password}
        type="password"
        placeholder="************"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={loading}
        errorMessage={errors.password}
        helperMessage={$t('login.fields.password_helper_message')}
        isRequired
      />
      {#if !data.profile}
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
      {/if}
      {#if submitError}
        <p class="text-sm text-red-500">{submitError}</p>
      {/if}
    {/if}
  </div>

  <div class="my-4 flex w-full items-center justify-end">
    {#if data.invite.accepted_at}
      <PrimaryButton
        label="Go to LMS"
        onClick={() => goto('/login')}
        className="sm:w-full w-full"
        isDisabled={disableSubmit || loading}
        isLoading={loading}
      />
    {:else}
      <PrimaryButton
        label="Access products"
        type="submit"
        className="sm:w-full w-full"
        isDisabled={disableSubmit || loading}
        isLoading={loading}
      />
    {/if}
  </div>
</AuthUI>
