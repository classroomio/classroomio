<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import { PUBLIC_ENABLE_USERS_COMPANIES } from '$env/static/public';
  import { Button } from '@cio/ui/base/button';

  const names = [
    { label: 'Audience', color: '#3ADFEC' },
    { label: 'Employees', color: '#BF0696' },
    { label: 'Customers', color: '#0233BD' },
    { label: 'Students', color: '#9747FF' }
  ];
  let animate = $state(false);
  let titleIndex = $state(0);
  let timeout: NodeJS.Timeout;

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

<div class="hero-bg relative h-full w-full border-b-2 bg-[#F5F8FE] pt-18 text-center">
  <div class="w-full pt-24">
    <div class="mb-10 ml-[5%] flex w-full items-center justify-start lg:ml-0 lg:justify-center">
      <a
        target="_blank"
        rel="noopener noreferrer nofollow"
        href="/github"
        style="color: rgb(75, 85, 99);"
        class="rounded-full border-2 border-[#C2D2FF] bg-[#DCE5FF] px-4 py-1 text-sm font-medium text-[#4B5563] hover:underline"
        >We are <span class="ui:text-primary">100%</span> open source</a
      >
    </div>

    <div class="absolute top-[10%] left-[5%] hidden w-[90%] justify-between lg:flex">
      {#if animate}
        <div
          class="relative rotate-12 transition-all hover:scale-110"
          transition:fly={{ y: 100, delay: 0, easing: sineInOut }}
        >
          <a
            href="/#collaboration"
            class="rounded-[4px] border-[1.5px] border-[#3ADFEC] bg-white px-6 py-2 text-lg font-bold text-[#3ADFEC]"
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
          class="relative -rotate-12 transition-all hover:scale-110"
          transition:fly={{ x: 100, delay: 50, easing: sineInOut }}
        >
          <a
            href="/github"
            target="_blank"
            class="rounded-[4px] border-[1.5px] border-[#BF0696] bg-white px-6 py-2 text-lg font-bold text-[#BF0696]"
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
      <div class="ml-6 text-left text-2xl font-semibold text-slate-900 lg:text-center lg:text-6xl">
        <span>Educate Your</span>
        <div class="mb-2 flex flex-wrap items-center justify-center lg:gap-3">
          <span
            class="relative mt-1 mb-0 inline-block h-[40px] w-full overflow-hidden md:mt-0 md:h-[50px] lg:-mb-4 lg:h-[75px] lg:w-[48%] lg:text-center"
          >
            {#key titleIndex}
              <span
                class="absolute right-[unset] left-0 w-full lg:right-0 lg:left-[unset]"
                style="color: {names[titleIndex].color}"
                transition:fly={{ y: 100, delay: 0, easing: sineInOut }}
              >
                <span class="m-auto w-full text-center">
                  {names[titleIndex].label}
                </span>
              </span>
            {/key}
          </span>
        </div>
        <span>from one Platform</span>
      </div>

      <p class="ui:text-muted-foreground mx-auto mt-10 px-4 md:text-lg lg:mt-6 lg:w-[42%] lg:p-0">
        ClassroomIO is an open source learning management system for companies. We give you a suite of tools to help you
        achieve your training, onboarding and certification goals.
      </p>
    </div>

    <div class="absolute top-[30%] left-[5%] hidden w-[90%] justify-between lg:flex">
      {#if animate}
        <div
          class="relative -rotate-12 transition-all hover:scale-110"
          transition:fly={{ x: -100, delay: 100, easing: sineInOut }}
        >
          <a
            href="/#customization"
            class="rounded-[4px] border-[1.5px] border-[#0233BD] bg-white px-6 py-2 text-lg font-bold text-[#0233BD]"
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
            <rect width="10.9223" height="10.9223" fill="#0233BD" />
          </svg>
        </div>
        <div
          class="relative rotate-12 transition-all hover:scale-110"
          transition:fly={{ y: 100, delay: 150, easing: sineInOut }}
        >
          <a
            href="/#ai"
            class="rounded-[4px] border-[1.5px] border-[#9747FF] bg-white px-6 py-2 text-lg font-bold text-[#9747FF]"
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
      <Button variant="outline" href="/demo" target="_blank" rel="noopener noreferrer nofollow">Book a demo</Button>
      <Button href="/signup" target="_blank" rel="noopener noreferrer nofollow">Sign Up for Free</Button>
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
    <div style="position: relative; padding-bottom: calc(50% + 42px);" class="mx-auto w-[85%] lg:w-[70%]">
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
