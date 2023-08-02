<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import GoogleIconColored from '../Icons/GoogleIconColored.svelte';

  export let supabase;
  export let handleSubmit;
  export let isLogin = true;
  export let showOnlyContent = false;
  export let showLogo = false;
  export let formRef;

  async function signInWithGoogle() {
    try {
      console.log('signInWithGoogle');
      const { user, session, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      console.log('user', user);
      console.log('session', session);
      console.log('error', error);
    } catch (error) {
      console.log('catch error', error);
    }
  }
</script>

<div class="w-full min-h-screen flex items-center justify-center mt-4">
  <div class="container border border-gray bg-white dark:bg-gray-800">
    <div class="flex items-center flex-col p-2 lg:px-8 lg:py-3">
      {#if !showOnlyContent || showLogo}
        <div class="flex items-center w-full justify-center pt-4">
          <img
            src="/logo-192.png"
            alt="ClassroomIO logo"
            height="50"
            width="50"
            data-atf="1"
          />
          <h4 class="dark:text-white text-xl">ClassroomIO</h4>
        </div>
      {/if}
      <form
        bind:this={formRef}
        on:submit|preventDefault={handleSubmit}
        class="flex items-center flex-col w-10/12"
      >
        <slot />
      </form>
      {#if !showOnlyContent}
        <div class="w-10/12 mb-3">
          <p class="dark:text-white text-sm mb-5">or sign up with:</p>
          <PrimaryButton
            variant={VARIANTS.OUTLINED}
            onClick={signInWithGoogle}
            className="py-3 sm:w-full w-full"
          >
            <GoogleIconColored />
            <span class="ml-2"
              >{isLogin ? 'Sign in' : 'Sign up'} with Google</span
            >
          </PrimaryButton>
        </div>
      {/if}
    </div>
    {#if !showOnlyContent}
      <div class="w-full p-6 border-t border-grey text-center">
        {#if isLogin}
          Not registered yet? <a
            class="hover:underline text-blue-700"
            href="/signup">Sign up</a
          >
        {:else}
          Already have an account? <a
            class="hover:underline text-blue-700"
            href="/login">Log In</a
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
