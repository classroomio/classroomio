<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import type { Profile } from '$lib/components/Course/components/People/types';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import { logout } from '$lib/utils/functions/logout';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { setTheme } from '$lib/utils/functions/theme';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import {
    authValidation,
    getConfirmPasswordError,
    getDisableSubmit
  } from '$lib/utils/functions/validator';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import { onMount } from 'svelte';
  import { snackbar } from '$lib/components/Snackbar/store.js';

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
      let profile: Profile | null = data.invite.profile;

      if (!data.invite.profile) {
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

      // Update member response
      const updateMemberRes = await supabase
        .from('organizationmember')
        .update({
          verified: true,
          profile_id: profile.id
        })
        .match({ email: profile.email, organization_id: data.invite.currentOrg?.id });

      console.log('Update member response', updateMemberRes);

      formRef?.reset();

      return goto($currentOrgPath);
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
    const redirectTo = $page.url.pathname;

    const url = new URL($page.url.pathname);
    url.searchParams.set('redirect', redirectTo);
    console.log('url', url.toString());
    goto(url.toString());

    setTheme(data.invite.currentOrg?.theme || '');

    setCurOrg(data.invite.currentOrg as CurrentOrg);
  });

  $: errors.confirmPassword = getConfirmPasswordError(fields);
  $: disableSubmit = getDisableSubmit(fields);

  $: autoLogout($profile?.email);
  function autoLogout(email?: string) {
    console.log('email', email);
    console.log('data.invite.email', data.invite.email);
    if (!email) return;

    if (email !== data.invite.email) {
      console.log('logout');
      logout(false);
    }
  }
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<AuthUI {supabase} isLogin={false} {handleSubmit} isLoading={loading} showLogo={true} bind:formRef>
  <div class="mt-4 w-full">
    <p class="mb-6 text-lg font-semibold dark:text-white">
      {#if data.invite.profile}
        {$t('login.login_to_join')}
      {:else}
        {$t('login.create_to_join')}
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
    {#if !data.invite.profile}
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
    {#if !data.invite.profile}
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
  </div>

  <div class="my-4 flex w-full items-center justify-end">
    <PrimaryButton
      label="Accept Invite"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
