<script context="module">
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script>
  import { Chasing } from 'svelte-loading-spinners';
  import TextField from '../components/Form/TextField.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import { getSupabase } from '../utils/functions/supabase';
  import { user } from '../utils/store/user';
  import AuthUI from '../components/AuthUI/index.svelte';

  export let config;

  let supabase = getSupabase(config);
  let email;
  let name;
  let password;
  let passwordAgain;
  let loading = false;
  let success = false;
  let errors = {};

  async function handleSubmit() {
    if (!email) {
      errors = {
        email: 'Email is required',
        password: 'Password is required',
      };
      return;
    }

    try {
      loading = true;
      const { data, error } = await supabase.auth.signIn(
        { email },
        {
          redirectTo: window.location.origin + '/login',
        }
      );
      if (error) throw error;

      success = true;
      email = {};
    } catch (error) {
      errors = {
        email: error.error_description || error.message,
      };
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign Up - ClassroomIO</title>
</svelte:head>

<AuthUI {supabase} isLogin={false} {handleSubmit}>
  <div class="mt-4 w-full">
    {#if $user.fetchingUser}
      <div class="h-40 text-md flex items-center justify-center">
        <Chasing size="60" color="#ff3e00" unit="px" duration="1s" />
      </div>
    {:else if success}
      <div class="h-40 text-md flex items-center justify-center flex-col">
        <p class="">
          A link has been sent to your email. Please check both your
          <strong>spam </strong>and your<strong>&nbsp; inbox</strong>.
        </p>
        <p class="mt-2 underline">
          If our email is in your spam, do make sure you mark our email address
          as safe, then move it from your spam to your inbox.
        </p>
      </div>
    {:else}
      <p class="text-lg font-semibold mb-6">Create a free account</p>
      <TextField
        label="Full Name"
        bind:value={name}
        type="text"
        autoFocus={true}
        placeholder="e.g Joke Silva"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={loading}
        errorMessage={errors.name}
      />
      <TextField
        label="Your Email"
        bind:value={email}
        type="email"
        placeholder="you@domain.com"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={loading}
        errorMessage={errors.email}
      />
      <TextField
        label="Your Password"
        bind:value={password}
        type="password"
        placeholder="************"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={loading}
        errorMessage={errors.password}
      />
      <TextField
        label="Confirm Password"
        bind:value={passwordAgain}
        type="password"
        placeholder="************"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={loading}
        errorMessage={errors.passwordAgain}
      />
      <div class="w-full text-right">
        <a class="text-md text-blue-700" href="/forgot"> Forgot password? </a>
      </div>
    {/if}
  </div>

  {#if !success}
    <div class="my-4 w-full flex justify-end items-center">
      <!-- <a href="/login" class="text-blue-700 text-sm">Create an account</a> -->
      <PrimaryButton
        label={loading ? 'Creating...' : 'Log In'}
        type="submit"
        className="py-3 sm:w-full w-full"
        isDisabled={loading}
      />
    </div>
  {/if}
</AuthUI>
