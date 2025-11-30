<script lang="ts">
  import { page } from '$app/state';
  import { AuthUI } from '$lib/features/ui';
  import type { Profile } from '$lib/components/Course/components/People/types';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import { logout } from '$lib/utils/functions/logout';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { setTheme } from '$lib/utils/functions/theme';
  import { t } from '$lib/utils/functions/translations';
  import { profile, user } from '$lib/utils/store/user';
  import { authValidation, getConfirmPasswordError, getDisableSubmit } from '$lib/utils/functions/validator';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import { onMount, untrack } from 'svelte';
  import { snackbar } from '$lib/components/Snackbar/store.js';

  let { data } = $props();

  let supabase = getSupabase();
  let fields = $state(Object.assign({}, SIGNUP_FIELDS));
  let loading = $state(false);
  let isLoggingOut = $state(false);
  let shouldLogout = $state(false);

  let errors: {
    name?: string;
    email?: string;
    password?: string;
  } = $state({});

  let submitError: string = $state('');

  const confirmPasswordError = $derived(getConfirmPasswordError(fields));
  const disableSubmit = $derived(getDisableSubmit(fields));

  async function joinOrg(profileId: string, email: string | null) {
    if (!profileId || !email || !data.invite.currentOrg?.id) return;

    // Update member response
    const updateMemberRes = await supabase
      .from('organizationmember')
      .update({
        verified: true,
        profile_id: profileId
      })
      .match({ email: email, organization_id: data.invite.currentOrg?.id });

    console.log('Update member response', updateMemberRes);

    window.location.href = $currentOrgPath;
  }

  async function signUserIn(profileId: string, email: string) {
    if (!profileId || !email) {
      throw $t('login.validation.unable_to_create_profile');
    }

    const res = await supabase.auth.signInWithPassword({
      email,
      password: fields.password
    });

    if (res.error) {
      throw res.error;
    }
  }

  async function handleSubmit() {
    if ($profile && $profile.id) {
      loading = true;
      await joinOrg($profile.id, $profile.email);
      return;
    }

    const validationRes = authValidation({
      ...fields,
      email: data.invite.email // validation for this ema
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

      await signUserIn(profile.id, profile.email);

      await joinOrg(profile.id, profile.email);
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
    setTheme(data.invite.currentOrg?.theme || '');

    setCurOrg(data.invite.currentOrg as CurrentOrg);
  });

  const isLoading = $derived(loading || $user.fetchingUser);

  $effect(() => {
    const email = $profile?.email;
    if (!email) return;

    if (email !== data.invite.email) {
      console.log('logout');
      snackbar.error('You are logged in with a different email');
      untrack(() => {
        shouldLogout = true;
      });
    }
  });
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<AuthUI redirectPathname={page.url.pathname} isLogin={false} {handleSubmit} {isLoading} showLogo={true}>
  <div class="mt-4 w-full {shouldLogout ? 'hidden' : ''}">
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
    {#if $profile?.email !== data.invite.email}
      {#if !data.invite.profile}
        <TextField
          label={$t('login.fields.full_name')}
          bind:value={fields.name}
          type="text"
          autoFocus={true}
          placeholder="e.g Joke Silva"
          className="mb-6"
          inputClassName="w-full"
          isDisabled={isLoading}
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
        isDisabled={isLoading}
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
          isDisabled={isLoading}
          errorMessage={confirmPasswordError}
          isRequired
        />
      {/if}
    {/if}
    {#if submitError}
      <p class="text-sm text-red-500">{submitError}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full items-center justify-end">
    {#if shouldLogout}
      <PrimaryButton
        label="Logout"
        type="button"
        className="sm:w-full w-full"
        isLoading={isLoggingOut}
        variant={VARIANTS.CONTAINED_DANGER}
        onClick={async () => {
          isLoggingOut = true;

          await logout(false);

          isLoggingOut = false;
          shouldLogout = false;
        }}
      />
    {:else}
      <PrimaryButton
        label="Accept Invite"
        type="submit"
        className="sm:w-full w-full"
        isDisabled={disableSubmit}
        {isLoading}
      />
    {/if}
  </div>
</AuthUI>
