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

  export let config;

  let supabase = getSupabase(config);
  let email;
  let loading = false;
  let success = false;
  let errors = {};

  async function handleSubmit() {
    if (!email) {
      errors = {
        email: 'Email is required',
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
  <title>Join ClassroomIO</title>
</svelte:head>

<div class="w-full h-screen flex items-center justify-center ">
  <div class="container border border-gray-300 rounded-md p-2 lg:p-12">
    <form
      on:submit|preventDefault={handleSubmit}
      class="flex items-center flex-col w-full"
    >
      <img
        src="/logo-192.png"
        alt="ClassroomIO logo"
        height="70"
        width="70"
        data-atf="1"
      />
      <h4 class="text-lg m-0 mt-3">Login</h4>
      <p class="text-sm">into ClassroomIO</p>

      <div class="my-4 w-full">
        {#if $user.fetchingUser}
          <div class="h-40 text-md flex items-center justify-center">
            <Chasing size="60" color="#ff3e00" unit="px" duration="1s" />
          </div>
        {:else if success}
          <div class="h-40 text-md flex items-center justify-center flex-col">
            <p class="">
              A link has been sent to your email. Please check both your
              <strong>spam </strong>and your<strong> inbox</strong>.
            </p>
            <p class="mt-2 underline">
              If our email is in your spam, do make sure you mark our email
              address as safe, then move it from your spam to your inbox.
            </p>
          </div>
        {:else}
          <TextField
            label="Email address"
            bind:value={email}
            type="email"
            autoFocus={true}
            placeholder="you@domain.com"
            inputClassName="rounded-md w-full px-2 py-4"
            isDisabled={loading}
            errorMessage={errors.email}
          />
          <p class="py-3 text-md">
            A magic link will be sent to your email, please open the link
          </p>
        {/if}
      </div>

      {#if !success}
        <div class="my-4 w-full flex justify-end items-center">
          <!-- <a href="/login" class="text-blue-700 text-sm">Create an account</a> -->
          <PrimaryButton
            label={loading ? 'Creating...' : 'Next'}
            type="submit"
            className="py-2 px-4"
            isDisabled={loading}
          />
        </div>
      {/if}
    </form>
  </div>
</div>

<style>
  .container {
    width: 450px;
  }
</style>
