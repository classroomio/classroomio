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

<div class="relative mt-[30%] border-b-2 text-center md:mt-36">
  <div class="mb-10 flex w-full items-center justify-center">
    <a
      target="_blank"
      rel="noopener noreferrer nofollow"
      href="https://github.com/rotimi-best/classroomio"
      style="color: rgb(75, 85, 99);"
      class="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium hover:underline"
      >Give us a <span class="text-blue-700">star</span> on github</a
    >
  </div>
  <h1
    class="mx-auto flex flex-col items-center text-3xl font-normal leading-[1.5] text-slate-900 md:text-4xl lg:text-6xl"
  >
    <span class="mb-2">Launch <span class="relative text-blue-700">Your</span> Online Bootcamp</span
    >
    <span class="relative text-blue-700"
      >In Minutes
      <svg
        aria-hidden="true"
        viewBox="0 0 418 42"
        class="absolute right-[-20%] top-3/4 h-[0.58em] fill-indigo-300/70"
        preserveAspectRatio="none"
      >
        <path
          d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"
        />
      </svg>
    </span>
  </h1>

  <p class="text-md mx-auto mt-10 px-4 text-slate-700 md:text-lg lg:mt-6 lg:w-2/4 lg:p-0">
    Meet a better learning management system (LMS) for teachers and students. ClassroomIO allows you
    to launch and scale your online bootcamp with ease.
  </p>
  <div class="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
    <a
      class="md:text-md w-11/12 rounded-md bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-all delay-100 hover:bg-blue-800 hover:shadow-xl md:w-fit lg:px-6 lg:py-5 lg:font-semibold"
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
