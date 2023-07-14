<script>
  import { stores, goto } from '@sapper/app';
  const { page } = stores();
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  const src = './bg-404.png';

  $: console.log('route', $page);
</script>

<div
  style="background-image:url({src});
background-size:contain"
  class="error flex items-center justify-center w-screen overflow-hidden"
>
  <div
    class="error flex items-center justify-center gap-20 bg-gray-200 dark:bg-transparent"
  >
    <div class=" dark:text-white gap-3 w-2/5">
      <p class="text-3xl dark:text-white font-semibold mb-5">
        Oops😕,where did the page go?
      </p>
      <p class="text-base text-gray-600 dark:text-white mb-5">
        We're sorry, but something went wrong and we can't show you the page
        you're looking for. In the meantime, here's a joke to make you laugh:<br
        />
        What do you call a fish with no eyes? Fsh!
      </p>
      <PrimaryButton
        label="Go to Home"
        className="rounded-md"
        onClick={() => goto('/')}
      />
    </div>
    <img src="/classroom-404.png" alt="classroomio_error_image" />
  </div>
</div>

<style>
  .error {
    height: calc(100vh - 57px);
  }
</style>
