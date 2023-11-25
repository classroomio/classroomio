<script>
  // import ImageCompare from './ImageCompare.svelte';
  import { PUBLIC_ENABLE_USERS_COMPANIES } from '$env/static/public';
</script>

<div class="text-center mt-[30%] md:mt-36 border-b-2 relative">
  <div class="mb-10 flex items-center justify-center w-full">
    <!-- <a
      target="_blank"
      rel="noopener noreferrer nofollow"
      href="https://github.com/rotimi-best/quizify"
      style="color: rgb(75, 85, 99);"
      class="border border-gray-300 rounded-full px-4 py-1 text-sm font-medium hover:underline"
      >Give us a <span class="text-[#1D4EE2]">star</span> on github</a
    > -->
    <a
      href="https://www.producthunt.com/posts/classroomio?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-classroomio"
      target="_blank"
      ><img
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=425236&theme=light"
        alt="ClassroomIO - The&#0032;Open&#0032;Source&#0032;Platform&#0032;for&#0032;Tech&#0032;Bootcamps | Product Hunt"
        style="width: 250px; height: 54px;"
        width="250"
        height="54"
      /></a
    >
  </div>
  <h1
    class="mx-auto text-3xl md:text-4xl lg:text-6xl font-normal leading-[1.5] text-slate-900 flex flex-col items-center gap-4"
  >
    <span>The Open Source Platform</span>
    <span class="text-[#1D4EE2] relative"
      >for Tech Bootcamps<svg
        aria-hidden="true"
        viewBox="0 0 418 42"
        class="absolute left-[10%] top-3/4 h-[0.58em] fill-indigo-300/70"
        preserveAspectRatio="none"
        ><path
          d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"
        /></svg
      ></span
    >
  </h1>

  <p
    class="mx-auto mt-10 lg:mt-6 px-4 lg:p-0 text-md md:text-xl tracking-wide leading-6 lg:leading-10 text-slate-700 lg:w-2/4"
  >
    Spend less time doing the boring stuffs, instead focus on impacting the
    lives of your students.
  </p>
  <button
    class="font-medium lg:font-semibold text-sm md:text-md text-white px-6 py-3 lg:px-10 lg:py-5 bg-[#1D4EE2] rounded-md lg:rounded-xl mt-10"
    data-cal-config={"{'layout':'month_view'}"}
    data-cal-link="classroomio/demo"
  >
    Let's show you 😍️️️️️️
  </button>

  <div class="relative my-5 md:my-10">
    <!-- <ImageCompare
      before="https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/landingpage/courses-light-mode.png"
      after="https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/landingpage/courses-dark-mode.png"
    /> -->
    <video
      class="floating w-[85%] lg:w-[70%] mx-auto rounded-lg shadow-lg"
      autoplay
      loop
      muted
      defaultMuted
      playsinline
      preload="auto"
    >
      <source
        src="https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/landingpage/dark-light-mode-demo.mp4"
        type="video/mp4"
      />
      <track kind="captions" />
    </video>
  </div>

  {#if PUBLIC_ENABLE_USERS_COMPANIES}
    <div class="px-[15%] mb-[10%]">
      <h2 class="inter text-base lg:text-xl font-semibold text-gray-900">
        Used at
      </h2>
      <div
        class="w-full flex flex-wrap flex-row gap-5 justify-between items-center py-[5%]"
      >
        <img src="/hero-1.svg" alt="" class="w-[30%] lg:w-[13%]" />
        <img src="/hero-2.svg" alt="" class="w-[30%] lg:w-[13%]" />
        <img src="/hero-3.svg" alt="" class="w-[30%] lg:w-[13%]" />
        <img src="/hero-4.svg" alt="" class="w-[30%] lg:w-[13%]" />
        <img src="/hero-5.svg" alt="" class="w-[30%] lg:w-[13%]" />
      </div>
    </div>
  {/if}
</div>
