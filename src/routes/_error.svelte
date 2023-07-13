<script>
  // export let error;
  // const dev = process.env.NODE_ENV === 'development';
  // let errorContent;
  // function report() {}
  // $: {
  //   try {
  //     errorContent = !!error ? JSON.stringify(error) : '';
  //   } catch (error) {}
  // }

  export let status;
  import { appStore } from "../utils/store/app";
  import ErrorIcon from "../components/Icons/ErrorIcon.svelte";
  import ErrorIconDarkMode from "../components/Icons/ErrorIconDarkMode.svelte";
</script>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<div class="error-page flex flex-wrap items-center justify-center h-full py-10 dark:bg-gray-800">

  <div class="error-message w-2/4">
    <h2 class="w-full text-3xl font-normal">Our server is taking a nap😴.</h2>
    <p class="dark:text-white w-full text-base font-normal my-0.5">Don't worry, your learning is safe. Our server is just taking a quick break to recharge. In the meantime, feel free to export the rest of our website or take a nap yourself.</p>
    <button on:click={() => window.open("mailto:support@classroomio.com", '_blank')}>Contact Us</button>
  </div>

  <div class="error-icon w-2/4 flex items-center justify-center">
    <!-- to check if it's in dark mode so as to render the appropriate svg -->
    {#if $appStore.isDark}
      <ErrorIconDarkMode />
    {:else}
      <ErrorIcon />
    {/if}

  </div>

</div>

<style>

  p {
    color: #656565;
    margin: 5% 0;
  }

  button {
    padding: 3% 10%;
    background: #0233BD;
    border-radius: 10px;
    font-size: 14px;
    color: #fff;
  }

  .error-icon {
    width: 19.5rem;
    height: 19.5rem;
  }

  /* Iphone (X, Xs, XR and 11) */
  @media only screen 
    and (device-width: 414px) 
    and (device-height: 896px) 
    and (-webkit-device-pixel-ratio: 2) {

    .error-page {
      padding: 10%;
      flex-direction: column-reverse;
    }
    
    .error-message {
      width: 100%;
    }  

    h2 {
      font-size: 1.5rem;
    }

    button {
      padding: 4% 15%;
    }

    .error-icon {
      width: 19rem;
      height: 19rem;
    }
  }

  /* iPhone 6+, 7+ and 8+ */
  @media only screen 
  and (min-device-width: 414px) 
  and (max-device-width: 736px) 
  and (-webkit-min-device-pixel-ratio: 3) {

    .error-page {
      padding: 10%;
      flex-direction: column-reverse;
    }
    
    .error-message {
      width: 100%;
    }  

    h2 {
      font-size: 1.5rem;
    }

    button {
      padding: 4% 15%;
    }

    .error-icon {
      width: 19rem;
      height: 19rem;
    }
  }

  /* iPhone 6, 6S, 7 and 8 */
  @media only screen 
    and (min-device-width: 375px) 
    and (max-device-height: 667px)  
    and (-webkit-device-pixel-ratio: 2) {
    .error-page {
      background: red;
      padding: 10%;
      flex-direction: column-reverse;
    }
    
    .error-message {
      width: 100%;
    }  

    h2 {
      font-size: 1.5rem;
    }

    button {
      padding: 4% 15%;
    }

    .error-icon {
      width: 19rem;
      height: 19rem;
    }
  }

</style>
