<script lang="ts">
  import { page } from '$app/stores';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import type { SupabaseClient } from '@supabase/supabase-js';
  import GoogleIconColored from '../Icons/GoogleIconColored.svelte';

  export let supabase: SupabaseClient;
  export let handleSubmit = () => {};
  export let isLogin = true;
  export let showOnlyContent = false;
  export let isLoading = false;
  export let showLogo = false;
  export let formRef;
  export let hideGoogleAuth = false;
  export let redirectPathname = '';

  $: console.log('redirectPathname', redirectPathname);

  async function signInWithGoogle() {
    if (isLoading) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    console.log({ params });
    // const redirectTo = `https://app.classroomio.com?forwardTo=${
    //   window.location.origin + params.get('redirect')
    // }`;
    const pathname = redirectPathname || params.get('redirect');
    const redirectTo = `${window.location.origin + pathname}`;

    console.log({ redirectTo });

    try {
      console.log('signInWithGoogle');
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo
        }
      });

      console.log('data', data);
      console.log('error', error);
    } catch (error) {
      console.log('catch error', error);
    }
  }
</script>

<div class="app-background flex min-h-screen w-full items-center justify-center">
  <div class="border-gray container border bg-white dark:bg-black">
    <div class="flex flex-col items-center p-2 lg:px-8 lg:py-3">
      {#if !showOnlyContent || showLogo}
        <div class="flex w-full flex-col items-center justify-center pt-2">
          <Avatar
            src={$currentOrg.avatar_url ? $currentOrg.avatar_url : '/logo-192.png'}
            name={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
            shape="rounded-md"
            width="w-10"
            height="max-h-10"
            className="mr-2"
          />
          <a href="/">
            <h4 class="mt-0 text-xl dark:text-white">
              {$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
            </h4>
          </a>
        </div>
      {/if}
      <form
        bind:this={formRef}
        on:submit|preventDefault={handleSubmit}
        class="flex w-10/12 flex-col items-center"
      >
        <slot />
      </form>
      {#if !showOnlyContent && !hideGoogleAuth}
        <div class="mb-3 w-10/12">
          <p class="mb-5 text-sm dark:text-white">{$t('login.signup_with')}:</p>
          <PrimaryButton
            variant={VARIANTS.OUTLINED}
            onClick={signInWithGoogle}
            isDisabled={isLoading}
            className="py-3 sm:w-full w-full"
          >
            <GoogleIconColored />
            <span class="ml-2">
              {isLogin ? $t('login.login_with_google') : $t('login.signup_with_google')}
            </span>
          </PrimaryButton>
        </div>
      {/if}
    </div>
    {#if !showOnlyContent}
      <div class="border-grey w-full border-t p-6 text-center">
        {#if isLogin}
          {$t('login.not_registered_yet')}
          <a class="text-primary-700 hover:underline" href="/signup{$page.url.search}"
            >{$t('login.signup')}</a
          >
        {:else}
          {$t('login.already_have_account')}
          <a class="text-primary-700 hover:underline" href="/login{$page.url.search}"
            >{$t('login.login')}</a
          >
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    width: 450px;
  }
</style>
