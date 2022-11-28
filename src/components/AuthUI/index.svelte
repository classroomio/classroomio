<script>
  import PrimaryButton from '../PrimaryButton/index.svelte';
  import { VARIANTS } from '../PrimaryButton/constants';
  import GoogleIconColored from '../Icons/GoogleIconColored.svelte';

  export let supabase;
  export let handleSubmit;
  export let isLogin = true;

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  }
</script>

<div class="w-full min-h-screen flex items-center justify-center mt-4">
  <div class="container border border-gray bg-white">
    <div class="flex items-center flex-col p-2 lg:px-8 lg:py-4">
      <div class="flex items-center w-full justify-center">
        <img
          src="/logo-192.png"
          alt="ClassroomIO logo"
          height="50"
          width="50"
          data-atf="1"
        />
        <h4 class="text-xl">ClassroomIO</h4>
      </div>
      <form
        on:submit|preventDefault={handleSubmit}
        class="flex items-center flex-col w-10/12"
      >
        <slot />
      </form>
      <div class="w-10/12 mb-3">
        <p class="text-sm mb-5">or sign up with:</p>
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          onClick={signInWithGoogle}
          className="py-3 sm:w-full w-full"
        >
          <GoogleIconColored />
          <span class="ml-2">Sign up with Google</span>
        </PrimaryButton>
      </div>
    </div>
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
  </div>
</div>

<style>
  .container {
    width: 450px;
  }
</style>
