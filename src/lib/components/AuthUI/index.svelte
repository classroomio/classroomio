<script lang="ts">
  import { page } from '$app/stores';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import GoogleIconColored from '../Icons/GoogleIconColored.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import type { SupabaseClient } from '@supabase/supabase-js';

  export let supabase: SupabaseClient;
  export let handleSubmit = () => {};
  export let isLogin = true;
  export let showOnlyContent = false;
  export let isLoading = false;
  export let showLogo = false;
  export let formRef;
  export let hideGoogleAuth = false;

  async function signInWithGoogle() {
    if (isLoading) {
      return;
    }
    try {
      console.log('signInWithGoogle');
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });

      console.log('data', data);
      console.log('error', error);
    } catch (error) {
      console.log('catch error', error);
    }
  }
</script>

<div class="root w-full min-h-screen flex items-center justify-center">
  <div class="container border border-gray bg-white dark:bg-black">
    <div class="flex items-center flex-col p-2 lg:px-8 lg:py-3">
      {#if !showOnlyContent || showLogo}
        <div class="flex flex-col items-center justify-center w-full pt-2">
          <Avatar
            src={$currentOrg.avatar_url ? $currentOrg.avatar_url : '/logo-192.png'}
            name={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
            shape="rounded-md"
            width="w-10"
            height="h-10"
            className="mr-2"
          />
          <h4 class="dark:text-white text-xl mt-0">
            {$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
          </h4>
        </div>
      {/if}
      <form
        bind:this={formRef}
        on:submit|preventDefault={handleSubmit}
        class="flex items-center flex-col w-10/12"
      >
        <slot />
      </form>
      {#if !showOnlyContent && !hideGoogleAuth}
        <div class="w-10/12 mb-3">
          <p class="dark:text-white text-sm mb-5">or sign up with:</p>
          <PrimaryButton
            variant={VARIANTS.OUTLINED}
            onClick={signInWithGoogle}
            isDisabled={isLoading}
            className="py-3 sm:w-full w-full"
          >
            <GoogleIconColored />
            <span class="ml-2">{isLogin ? 'Sign in' : 'Sign up'} with Google</span>
          </PrimaryButton>
        </div>
      {/if}
    </div>
    {#if !showOnlyContent}
      <div class="w-full p-6 border-t border-grey text-center">
        {#if isLogin}
          Not registered yet? <a
            class="hover:underline text-primary-700"
            href="/signup{$page.url.search}">Sign up</a
          >
        {:else}
          Already have an account? <a
            class="hover:underline text-primary-700"
            href="/login{$page.url.search}">Log In</a
          >
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .root {
    background: radial-gradient(circle at 10% 20%, rgb(239, 246, 249) 0%, rgb(206, 239, 253) 90%);
  }
  .container {
    width: 450px;
  }
</style>
