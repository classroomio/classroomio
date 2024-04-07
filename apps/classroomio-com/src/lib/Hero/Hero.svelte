<script>
  import { onMount } from 'svelte';
  import { PUBLIC_ENABLE_USERS_COMPANIES } from '$env/static/public';

  let width = '710';
  let height = '710';

  onMount(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 768) {
        // Mobile view
        width = '1920';
        height = '1440';
      } else {
        // Desktop view
        width = '710';
        height = '710';
      }
    };

    handleResize(); // Call it initially

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<div class="relative pt-[30%] border-b-2 text-center md:pt-36 bg-[#F5F8FE]">
  <div class="mb-10 flex w-full items-center justify-center">
    <a
      target="_blank"
      rel="noopener noreferrer nofollow"
      href="https://github.com/rotimi-best/classroomio"
      style="color: rgb(75, 85, 99);"
      class="rounded-full border-2 border-[#C2D2FF] px-4 py-1 text-sm font-medium bg-[#DCE5FF] text-[#4B5563]"
      >Give us a <span class="text-blue-700">star</span> on github</a
    >
  </div>

  <div class="justify-between w-[90%] absolute top-[12%] left-[4%] hidden lg:flex">
    <div class="relative">
      <a
        href="/#collaboration"
        class="px-6 py-2 border-[1.5px] border-[#3ADFEC] rounded-[4px] text-[#3ADFEC] text-lg font-bold inter"
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

    <div class="relative">
      <a
        href="https://github.com/rotimi-best/classroomio"
        target="_blank"
        class="px-6 py-2 border-[1.5px] border-[#BF0696] rounded-[4px] text-[#BF0696] text-lg font-bold inter"
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
  </div>

  <h1 class="mx-auto w-[60%] text-3xl inter leading-[1.5] text-slate-900 md:text-4xl lg:text-6xl">
    Launch Your Online Bootcamp <span class="text-blue-700">In Minutes </span>
  </h1>

  <p class="text-md mx-auto mt-10 px-4 text-slate-700 md:text-lg lg:mt-6 lg:w-[40%] lg:p-0">
    Meet a better collaboration tool for teachers and students. ClassroomIO is a no-code tool that
    allows you build and scale your own teaching platform with ease.
  </p>

  <div class="justify-between w-[90%] absolute top-[35%] left-[4%] hidden lg:flex">
    <div class="relative">
      <a
        href="/#customization"
        class="px-6 py-2 border-[1.5px] border-[#0233BD] rounded-[4px] text-[#0233BD] text-lg font-bold inter"
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

    <div class="relative">
      <a
        href="/#ai"
        class="px-6 py-2 border-[1.5px] border-[#9747FF] rounded-[4px] text-[#9747FF] text-lg font-bold inter"
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
  </div>

  <div class="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
    <a
      class="md:text-md w-11/12 rounded-md bg-blue-700 px-6 py-3 text-sm font-medium text-white text-center transition-all delay-100 hover:bg-blue-800 hover:shadow-xl md:w-fit lg:px-6 lg:py-4 lg:font-semibold"
      href="/signup"
      rel="noopener noreferrer nofollow"
    >
      Get Started for Free 🚀
    </a>
    <!-- <a
      class="font-medium lg:font-semibold text-sm md:text-md w-11/12 md:w-fit border px-6 py-3 lg:px-10 lg:py-5 rounded-md"
      href="/github"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      View on Github
    </a> -->
  </div>

  <div class="relative my-5 md:my-10">
    <!-- <video
      class="floating w-[85%] lg:w-[70%] mx-auto rounded-lg shadow-lg"
      autoplay
      loop
      muted
      defaultMuted
      playsinline
      preload="auto"
    >
      <source src="./dark-light-mode.mp4" type="video/mp4" />
      <track kind="captions" />
    </video> -->

    <img
      loading="eager"
      {width}
      {height}
      src="./cio-hero-imac.webp"
      alt="hero section with dark vs light mode"
      class="floating mx-auto w-[85%] rounded-lg shadow-lg lg:w-[70%]"
    />
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
