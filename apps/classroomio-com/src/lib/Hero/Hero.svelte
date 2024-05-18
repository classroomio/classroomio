<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import { PUBLIC_ENABLE_USERS_COMPANIES } from '$env/static/public';

  const names = [
    { label: 'Bootcamp', color: '#3ADFEC' },
    { label: 'Course', color: '#BF0696' },
    { label: 'Training', color: '#0233BD' },
    { label: 'Academy', color: '#9747FF' }
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

<div class="hero-bg relative border-b-2 text-center bg-[#F5F8FE] h-full mt-[5%] w-full">
  <div class="pt-24 w-full">
    <div class="mb-10 ml-[5%] lg:ml-0 flex w-full items-center justify-start lg:justify-center">
      <a
        target="_blank"
        rel="noopener noreferrer nofollow"
        href="/github"
        style="color: rgb(75, 85, 99);"
        class="rounded-full border-2 border-[#C2D2FF] px-4 py-1 text-sm font-medium bg-[#DCE5FF] text-[#4B5563] hover:underline"
        >We are <span class="text-blue-700">100%</span> open source</a
      >
    </div>

    <div class="justify-between w-[90%] absolute top-[10%] left-[5%] hidden lg:flex">
      {#if animate}
        <div
          class="relative transition-all hover:scale-110 rotate-12"
          transition:fly={{ y: 100, delay: 0, easing: sineInOut }}
        >
          <a
            href="/#collaboration"
            class="px-6 py-2 border-[1.5px] border-[#3ADFEC] rounded-[4px] bg-white text-[#3ADFEC] text-lg font-bold"
            >Collaboration</a
          >
          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#3ADFEC" />
          </svg>
        </div>

        <div
          class="relative transition-all hover:scale-110 -rotate-12"
          transition:fly={{ x: 100, delay: 50, easing: sineInOut }}
        >
          <a
            href="/github"
            target="_blank"
            class="px-6 py-2 border-[1.5px] border-[#BF0696] rounded-[4px] bg-white text-[#BF0696] text-lg font-bold"
            >Open Source</a
          >
          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#BF0696" />
          </svg>
        </div>
      {/if}
    </div>

    <div class="w-full">
      <div
        class="font-bold md:leading-[1.5] text-left lg:text-center ml-6 text-slate-900 text-4xl lg:text-7xl"
      >
        <span>Launch Your Online</span> <br />
        <div class="flex-wrap flex items-center lg:gap-3">
          <span
            class="w-full lg:w-[48%] h-[40px] md:h-[50px] lg:h-[90px] mb-0 mt-1 md:mt-0 lg:-mb-4 relative inline-block overflow-hidden"
          >
            {#key titleIndex}
              <span
                class="absolute left-0 right-[unset] lg:right-0 lg:left-[unset]"
                style="color: {names[titleIndex].color}"
                transition:fly={{ y: 100, delay: 0, easing: sineInOut }}
              >
                {names[titleIndex].label}
              </span>
            {/key}
          </span>
          <span>In Minutes</span>
        </div>
      </div>

      <p class="text-base mx-auto mt-10 px-4 text-slate-700 md:text-lg lg:mt-6 lg:w-[42%] lg:p-0">
        Meet a better learning management system (LMS) for teachers and students. ClassroomIO allows
        you to launch and scale your online bootcamp with ease.
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
            class="px-6 py-2 border-[1.5px] border-[#0233BD] rounded-[4px] bg-white text-[#0233BD] text-lg font-bold"
            >Customizable LMS</a
          >

          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#0233BD" />
          </svg>
        </div>
        <div
          class="relative transition-all hover:scale-110 rotate-12"
          transition:fly={{ y: 100, delay: 150, easing: sineInOut }}
        >
          <a
            href="/#ai"
            class="px-6 py-2 border-[1.5px] border-[#9747FF] rounded-[4px] bg-white text-[#9747FF] text-lg font-bold"
            >AI Support</a
          >

          <svg
            class="absolute -right-1 -bottom-2.5"
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10.9223" height="10.9223" fill="#9747FF" />
          </svg>
        </div>
      {/if}
    </div>

    <div class="my-10 flex flex-col items-center justify-center gap-4 md:flex-row">
      <a
        class="md:text-base w-11/12 rounded-md border-gray-200 border-2 px-6 py-3 text-sm font-medium text-center transition-all delay-100 hover:bg-gray-200 hover:shadow-xl hover:scale-95 md:w-fit lg:px-6 lg:py-4 lg:font-semibold"
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
      <!-- <a
      class="font-medium lg:font-semibold text-sm md:text-base w-11/12 md:w-fit border px-6 py-3 lg:px-10 lg:py-5 rounded-md"
      href="/github"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      View on Github
    </a> -->
    </div>

    <!-- <div class="relative my-5 md:my-10">
      <img
        width="710"
        height="710"
        src="./cio-hero.webp"
        alt="hero section with dark vs light mode"
        class=""
      />
      
    </div> -->
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
        <h2 class="text-base font-semibold text-gray-900 lg:text-xl">Used at</h2>
        <div class="flex w-full flex-row flex-wrap items-center justify-between gap-5 py-[5%]">
          <img loading="lazy" src="/hero-1.svg" alt="" class="w-[30%] lg:w-[13%]" />
          <img loading="lazy" src="/hero-2.svg" alt="" class="w-[30%] lg:w-[13%]" />
          <img loading="lazy" src="/hero-3.svg" alt="" class="w-[30%] lg:w-[13%]" />
          <img loading="lazy" src="/hero-4.svg" alt="" class="w-[30%] lg:w-[13%]" />
          <img loading="lazy" src="/hero-5.svg" alt="" class="w-[30%] lg:w-[13%]" />
        </div>
      </div>
    {/if}
  </div>
</div>
