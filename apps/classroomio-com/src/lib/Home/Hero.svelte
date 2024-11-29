<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import { PUBLIC_ENABLE_USERS_COMPANIES } from '$env/static/public';

  const names = [
    { label: 'Audience', color: '#3ADFEC', darkColor: '#4FF0FF' },
    { label: 'Employees', color: '#BF0696', darkColor: '#FF00C7' },
    { label: 'Customers', color: '#0233BD', darkColor: '#0044FF' },
    { label: 'Students', color: '#9747FF', darkColor: '#B575FF' }
  ];
  let animate = false;
  let titleIndex = 0;
  let timeout: NodeJS.Timer;

  onMount(() => {
    setTimeout(() => {
      animate = true;
    }, 70);

    timeout = setInterval(() => {
      const nextIndex = titleIndex + 1;
      titleIndex = names[nextIndex] ? nextIndex : 0;
    }, 3000);
  });

  onDestroy(() => {
    clearTimeout(timeout);
  });
</script>

<div class="bg-[url('https://assets.cdn.clsrio.com/www/hero-bg.svg')] dark:bg-[url('https://assets.cdn.clsrio.com/www/hero-bg-dark.svg')] relative border-b-2 border-gray-200 dark:border-gray-700 text-center bg-[#F5F8FE] dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-full mt-[5%] w-full">
  <div class="pt-24 w-full">
    <div class="mb-10 ml-[5%] lg:ml-0 flex w-full items-center justify-start lg:justify-center">
      <a
        target="_blank"
        rel="noopener noreferrer nofollow"
        href="/github"
        class="rounded-full border-2 border-[#C2D2FF] dark:border-gray-600 px-4 py-1 text-sm font-medium bg-[#DCE5FF] dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 hover:underline"
      >
        We are <span class="text-blue-700 dark:text-blue-400">100%</span> open source
      </a>
    </div>

    <div class="justify-between w-[90%] absolute top-[10%] left-[5%] hidden lg:flex">
      {#if animate}
        <div
          class="relative transition-all hover:scale-110 rotate-12"
          transition:fly={{ y: 100, delay: 0, easing: sineInOut }}
        >
          <a
            href="/#collaboration"
            class="px-6 py-2 border-[1.5px] border-[#3ADFEC] dark:border-[#4FF0FF] rounded-[4px] bg-white dark:bg-gray-800 text-[#3ADFEC] dark:text-[#4FF0FF] text-lg font-bold"
          >
            Collaboration
          </a>
          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#3ADFEC" class="dark:fill-[#4FF0FF]" />
          </svg>
        </div>

        <div
          class="relative transition-all hover:scale-110 -rotate-12"
          transition:fly={{ x: 100, delay: 50, easing: sineInOut }}
        >
          <a
            href="/github"
            target="_blank"
            class="px-6 py-2 border-[1.5px] border-[#BF0696] dark:border-[#FF00C7] rounded-[4px] bg-white dark:bg-gray-800 text-[#BF0696] dark:text-[#FF00C7] text-lg font-bold"
          >
            Open Source
          </a>
          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#BF0696" class="dark:fill-[#FF00C7]" />
          </svg>
        </div>
      {/if}
    </div>

    <div class="w-full">
      <div
        class="font-bold md:leading-[1.5] text-left lg:text-center ml-6 text-slate-900 dark:text-gray-100 text-4xl lg:text-7xl"
      >
        <span>Educate Your</span>
        <div class="flex-wrap flex items-center justify-center lg:gap-3 mb-2">
          <span
            class="w-full lg:w-[48%] h-[40px] md:h-[50px] lg:h-[75px] mb-0 mt-1 md:mt-0 lg:-mb-4 relative inline-block overflow-hidden lg:text-center"
          >
            {#key titleIndex}
              <span
                class="absolute left-0 right-[unset] lg:right-0 lg:left-[unset] w-full"
                style="color: {names[titleIndex].color}"
                transition:fly={{ y: 100, delay: 0, easing: sineInOut }}
              >
                <span class="w-full text-center m-auto dark:text-[{names[titleIndex].darkColor}]">
                  {names[titleIndex].label}
                </span>
              </span>
            {/key}
          </span>
        </div>
        <span>from one Platform</span>
      </div>

      <p class="text-base mx-auto mt-10 px-4 text-slate-700 dark:text-gray-300 md:text-lg lg:mt-6 lg:w-[42%] lg:p-0">
        ClassroomIO is an open source learning management system for companies. We give you a suite
        of tools to help you achieve your training, onboarding and certification goals.
      </p>
    </div>

    <div class="justify-between w-[90%] absolute top-[30%] left-[5%] hidden lg:flex">
      {#if animate}
        <div
          class="relative transition-all hover:scale-110 -rotate-12"
          transition:fly={{ x: -100, delay: 100, easing: sineInOut }}
        >
          <a
            href="/#customization"
            class="px-6 py-2 border-[1.5px] border-[#0233BD] dark:border-[#0044FF] rounded-[4px] bg-white dark:bg-gray-800 text-[#0233BD] dark:text-[#0044FF] text-lg font-bold"
          >
            Customizable LMS
          </a>

          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#0233BD" class="dark:fill-[#0044FF]" />
          </svg>
        </div>
        <div
          class="relative transition-all hover:scale-110 rotate-12"
          transition:fly={{ y: 100, delay: 150, easing: sineInOut }}
        >
          <a
            href="/#ai"
            class="px-6 py-2 border-[1.5px] border-[#9747FF] dark:border-[#B575FF] rounded-[4px] bg-white dark:bg-gray-800 text-[#9747FF] dark:text-[#B575FF] text-lg font-bold"
          >
            AI Support
          </a>

          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#9747FF" class="dark:fill-[#B575FF]" />
          </svg>
        </div>
      {/if}
    </div>

    <div class="my-10 flex flex-col items-center justify-center gap-4 md:flex-row">
      <a
        class="md:text-base w-11/12 rounded-md border-gray-200 dark:border-gray-700 border-2 px-6 py-3 text-sm font-medium text-center transition-all delay-100 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-xl hover:scale-95 md:w-fit lg:px-6 lg:py-4 lg:font-semibold"
        href="/demo"
        rel="noopener noreferrer nofollow"
      >
        Book a demo
      </a>
      <a
        class="md:text-base w-11/12 rounded-md bg-blue-700 px-6 py-3 text-sm font-medium text-white text-center transition-all delay-100 hover:bg-blue-800 hover:shadow-xl hover:scale-95 md:w-fit lg:px-6 lg:py-4 lg:font-semibold"
        href="/signup"
        rel="noopener noreferrer nofollow"
      >
        Sign Up for Free
      </a>
    </div>

    <div
      style="position: relative; padding-bottom: calc(50% + 42px);"
      class="mx-auto w-[85%] lg:w-[70%]"
    >
      <iframe
        title="ClassroomIO Live Demo"
        src="https://app.supademo.com/embed/cluw8chyy06nhq2s9m697a680"
        allow="clipboard-write"
        frameborder="0"
        webkitallowfullscreen="true"
        mozallowfullscreen="true"
        allowfullscreen
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
      ></iframe>
    </div>

    {#if PUBLIC_ENABLE_USERS_COMPANIES}
      <div class="mb-[10%] px-[15%]">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100 lg:text-xl">Used at</h2>
        <div class="flex w-full flex-row flex-wrap items-center justify-between gap-5 py-[5%]">
          <img loading="lazy" src="/hero-1.svg" alt="" class="w-[30%] lg:w-[13%] dark:invert" />
          <img loading="lazy" src="/hero-2.svg" alt="" class="w-[30%] lg:w-[13%] dark:invert" />
          <img loading="lazy" src="/hero-3.svg" alt="" class="w-[30%] lg:w-[13%] dark:invert" />
          <img loading="lazy" src="/hero-4.svg" alt="" class="w-[30%] lg:w-[13%] dark:invert" />
          <img loading="lazy" src="/hero-5.svg" alt="" class="w-[30%] lg:w-[13%] dark:invert" />
        </div>
      </div>
    {/if}
  </div>
</div>