<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { PUBLIC_ENABLE_USERS_COMPANIES } from '$env/static/public';
  import { sineInOut } from 'svelte/easing';

  let width = '710';
  let height = '710';
  let animate = false;

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

    handleResize();
    setTimeout(() => {
      animate = true;
    }, 70);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<div
  class="relative border-b-2 text-center bg-[#F5F8FE] h-[110vh] lg:h-[200vh] mt-[6.5%] overflow-hidden"
>
  <div class="overflow-hidden absolute h-full top-[5%] z-0">
    <svg
      width="1407"
      height="1628"
      viewBox="0 0 1407 1628"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class=""
    >
      <path
        d="M1317.6 84.9V-16H1314.6V84.9H1225.7V-16H1222.7V84.9H1133.8V-16H1130.8V84.9H1041.9V-16H1038.9V84.9H950V-16H947V84.9H858.1V-16H855.1V84.9H766.2V-16H763.2V84.9H674.3V-16H671.3V84.9H582.4V-16H579.4V84.9H490.5V-16H487.5V84.9H398.6V-16H395.6V84.9H306.7V-16H303.7V84.9H214.8V-16H211.8V84.9H122.9V-16H119.9V84.9H30.9V-16H27.9V84.9H-61V87.9H27.9V188.8H-61V191.8H27.9V292.7H-61V295.7H27.9V396.6H-61V399.6H27.9V500.5H-61V503.5H27.9V604.4H-61V607.4H27.9V708.3H-61V711.3H27.9V812.2H-61V815.2H27.9V916.1H-61V919.1H27.9V1020H-61V1023H27.9V1124H-61V1127H27.9V1227.9H-61V1230.9H27.9V1331.8H-61V1334.8H27.9V1435.7H-61V1438.7H27.9V1539.6H-61V1542.6H27.9V1643.5H30.9V1542.6H119.8V1643.5H122.8V1542.6H211.7V1643.5H214.7V1542.6H303.6V1643.5H306.6V1542.6H395.5V1643.5H398.5V1542.6H487.4V1643.5H490.4V1542.6H579.3V1643.5H582.3V1542.6H671.2V1643.5H674.2V1542.6H763.1V1643.5H766.1V1542.6H855V1643.5H858V1542.6H946.9V1643.5H949.9V1542.6H1038.8V1643.5H1041.8V1542.6H1130.7V1643.5H1133.7V1542.6H1222.6V1643.5H1225.6V1542.6H1314.5V1643.5H1317.5V1542.6H1406.4V1539.6H1317.5V1438.7H1406.4V1435.7H1317.5V1334.8H1406.4V1331.8H1317.5V1230.9H1406.4V1227.9H1317.5V1127H1406.4V1124H1317.5V1023.1H1406.4V1020.1H1317.5V919.2H1406.4V916.2H1317.5V815.3H1406.4V812.3H1317.5V711.4H1406.4V708.4H1317.5V607.5H1406.4V604.5H1317.5V503.5H1406.4V500.5H1317.5V399.6H1406.4V396.6H1317.5V295.7H1406.4V292.7H1317.5V191.8H1406.4V188.8H1317.5V87.9H1406.4V84.9H1317.6ZM119.8 1539.6H30.9V1438.7H119.8V1539.6ZM119.8 1435.7H30.9V1334.8H119.8V1435.7ZM119.8 1331.8H30.9V1230.9H119.8V1331.8ZM119.8 1227.9H30.9V1127H119.8V1227.9ZM119.8 1124H30.9V1023.1H119.8V1124ZM119.8 1020.1H30.9V919.2H119.8V1020.1ZM119.8 916.2H30.9V815.3H119.8V916.2ZM119.8 812.3H30.9V711.4H119.8V812.3ZM119.8 708.4H30.9V607.5H119.8V708.4ZM119.8 604.5H30.9V503.5H119.8V604.5ZM119.8 500.5H30.9V399.6H119.8V500.5ZM119.8 396.6H30.9V295.7H119.8V396.6ZM119.8 292.7H30.9V191.8H119.8V292.7ZM119.8 188.8H30.9V87.9H119.8V188.8ZM211.7 1539.6H122.8V1438.7H211.7V1539.6ZM211.7 1435.7H122.8V1334.8H211.7V1435.7ZM211.7 1331.8H122.8V1230.9H211.7V1331.8ZM211.7 1227.9H122.8V1127H211.7V1227.9ZM211.7 1124H122.8V1023.1H211.7V1124ZM211.7 1020.1H122.8V919.2H211.7V1020.1ZM211.7 916.2H122.8V815.3H211.7V916.2ZM211.7 812.3H122.8V711.4H211.7V812.3ZM211.7 708.4H122.8V607.5H211.7V708.4ZM211.7 604.5H122.8V503.5H211.7V604.5ZM211.7 500.5H122.8V399.6H211.7V500.5ZM211.7 396.6H122.8V295.7H211.7V396.6ZM211.7 292.7H122.8V191.8H211.7V292.7ZM211.7 188.8H122.8V87.9H211.7V188.8ZM303.6 1539.6H214.7V1438.7H303.6V1539.6ZM303.6 1435.7H214.7V1334.8H303.6V1435.7ZM303.6 1331.8H214.7V1230.9H303.6V1331.8ZM303.6 1227.9H214.7V1127H303.6V1227.9ZM303.6 1124H214.7V1023.1H303.6V1124ZM303.6 1020.1H214.7V919.2H303.6V1020.1ZM303.6 916.2H214.7V815.3H303.6V916.2ZM303.6 812.3H214.7V711.4H303.6V812.3ZM303.6 708.4H214.7V607.5H303.6V708.4ZM303.6 604.5H214.7V503.5H303.6V604.5ZM303.6 500.5H214.7V399.6H303.6V500.5ZM303.6 396.6H214.7V295.7H303.6V396.6ZM303.6 292.7H214.7V191.8H303.6V292.7ZM303.6 188.8H214.7V87.9H303.6V188.8ZM395.5 1539.6H306.6V1438.7H395.5V1539.6ZM395.5 1435.7H306.6V1334.8H395.5V1435.7ZM395.5 1331.8H306.6V1230.9H395.5V1331.8ZM395.5 1227.9H306.6V1127H395.5V1227.9ZM395.5 1124H306.6V1023.1H395.5V1124ZM395.5 1020.1H306.6V919.2H395.5V1020.1ZM395.5 916.2H306.6V815.3H395.5V916.2ZM395.5 812.3H306.6V711.4H395.5V812.3ZM395.5 708.4H306.6V607.5H395.5V708.4ZM395.5 604.5H306.6V503.5H395.5V604.5ZM395.5 500.5H306.6V399.6H395.5V500.5ZM395.5 396.6H306.6V295.7H395.5V396.6ZM395.5 292.7H306.6V191.8H395.5V292.7ZM395.5 188.8H306.6V87.9H395.5V188.8ZM487.5 1539.6H398.6V1438.7H487.5V1539.6ZM487.5 1435.7H398.6V1334.8H487.5V1435.7ZM487.5 1331.8H398.6V1230.9H487.5V1331.8ZM487.5 1227.9H398.6V1127H487.5V1227.9ZM487.5 1124H398.6V1023.1H487.5V1124ZM487.5 1020.1H398.6V919.2H487.5V1020.1ZM487.5 916.2H398.6V815.3H487.5V916.2ZM487.5 812.3H398.6V711.4H487.5V812.3ZM487.5 708.4H398.6V607.5H487.5V708.4ZM487.5 604.5H398.6V503.5H487.5V604.5ZM487.5 500.5H398.6V399.6H487.5V500.5ZM487.5 396.6H398.6V295.7H487.5V396.6ZM487.5 292.7H398.6V191.8H487.5V292.7ZM487.5 188.8H398.6V87.9H487.5V188.8ZM579.4 1539.6H490.5V1438.7H579.4V1539.6ZM579.4 1435.7H490.5V1334.8H579.4V1435.7ZM579.4 1331.8H490.5V1230.9H579.4V1331.8ZM579.4 1227.9H490.5V1127H579.4V1227.9ZM579.4 1124H490.5V1023.1H579.4V1124ZM579.4 1020.1H490.5V919.2H579.4V1020.1ZM579.4 916.2H490.5V815.3H579.4V916.2ZM579.4 812.3H490.5V711.4H579.4V812.3ZM579.4 708.4H490.5V607.5H579.4V708.4ZM579.4 604.5H490.5V503.5H579.4V604.5ZM579.4 500.5H490.5V399.6H579.4V500.5ZM579.4 396.6H490.5V295.7H579.4V396.6ZM579.4 292.7H490.5V191.8H579.4V292.7ZM579.4 188.8H490.5V87.9H579.4V188.8ZM671.3 1539.6H582.4V1438.7H671.3V1539.6ZM671.3 1435.7H582.4V1334.8H671.3V1435.7ZM671.3 1331.8H582.4V1230.9H671.3V1331.8ZM671.3 1227.9H582.4V1127H671.3V1227.9ZM671.3 1124H582.4V1023.1H671.3V1124ZM671.3 1020.1H582.4V919.2H671.3V1020.1ZM671.3 916.2H582.4V815.3H671.3V916.2ZM671.3 812.3H582.4V711.4H671.3V812.3ZM671.3 708.4H582.4V607.5H671.3V708.4ZM671.3 604.5H582.4V503.5H671.3V604.5ZM671.3 500.5H582.4V399.6H671.3V500.5ZM671.3 396.6H582.4V295.7H671.3V396.6ZM671.3 292.7H582.4V191.8H671.3V292.7ZM671.3 188.8H582.4V87.9H671.3V188.8ZM763.2 1539.6H674.3V1438.7H763.2V1539.6ZM763.2 1435.7H674.3V1334.8H763.2V1435.7ZM763.2 1331.8H674.3V1230.9H763.2V1331.8ZM763.2 1227.9H674.3V1127H763.2V1227.9ZM763.2 1124H674.3V1023.1H763.2V1124ZM763.2 1020.1H674.3V919.2H763.2V1020.1ZM763.2 916.2H674.3V815.3H763.2V916.2ZM763.2 812.3H674.3V711.4H763.2V812.3ZM763.2 708.4H674.3V607.5H763.2V708.4ZM763.2 604.5H674.3V503.5H763.2V604.5ZM763.2 500.5H674.3V399.6H763.2V500.5ZM763.2 396.6H674.3V295.7H763.2V396.6ZM763.2 292.7H674.3V191.8H763.2V292.7ZM763.2 188.8H674.3V87.9H763.2V188.8ZM855.1 1539.6H766.2V1438.7H855.1V1539.6ZM855.1 1435.7H766.2V1334.8H855.1V1435.7ZM855.1 1331.8H766.2V1230.9H855.1V1331.8ZM855.1 1227.9H766.2V1127H855.1V1227.9ZM855.1 1124H766.2V1023.1H855.1V1124ZM855.1 1020.1H766.2V919.2H855.1V1020.1ZM855.1 916.2H766.2V815.3H855.1V916.2ZM855.1 812.3H766.2V711.4H855.1V812.3ZM855.1 708.4H766.2V607.5H855.1V708.4ZM855.1 604.5H766.2V503.5H855.1V604.5ZM855.1 500.5H766.2V399.6H855.1V500.5ZM855.1 396.6H766.2V295.7H855.1V396.6ZM855.1 292.7H766.2V191.8H855.1V292.7ZM855.1 188.8H766.2V87.9H855.1V188.8ZM947 1539.6H858.1V1438.7H947V1539.6ZM947 1435.7H858.1V1334.8H947V1435.7ZM947 1331.8H858.1V1230.9H947V1331.8ZM947 1227.9H858.1V1127H947V1227.9ZM947 1124H858.1V1023.1H947V1124ZM947 1020.1H858.1V919.2H947V1020.1ZM947 916.2H858.1V815.3H947V916.2ZM947 812.3H858.1V711.4H947V812.3ZM947 708.4H858.1V607.5H947V708.4ZM947 604.5H858.1V503.5H947V604.5ZM947 500.5H858.1V399.6H947V500.5ZM947 396.6H858.1V295.7H947V396.6ZM947 292.7H858.1V191.8H947V292.7ZM947 188.8H858.1V87.9H947V188.8ZM1038.9 1539.6H950V1438.7H1038.9V1539.6ZM1038.9 1435.7H950V1334.8H1038.9V1435.7ZM1038.9 1331.8H950V1230.9H1038.9V1331.8ZM1038.9 1227.9H950V1127H1038.9V1227.9ZM1038.9 1124H950V1023.1H1038.9V1124ZM1038.9 1020.1H950V919.2H1038.9V1020.1ZM1038.9 916.2H950V815.3H1038.9V916.2ZM1038.9 812.3H950V711.4H1038.9V812.3ZM1038.9 708.4H950V607.5H1038.9V708.4ZM1038.9 604.5H950V503.5H1038.9V604.5ZM1038.9 500.5H950V399.6H1038.9V500.5ZM1038.9 396.6H950V295.7H1038.9V396.6ZM1038.9 292.7H950V191.8H1038.9V292.7ZM1038.9 188.8H950V87.9H1038.9V188.8ZM1130.8 1539.6H1041.9V1438.7H1130.8V1539.6ZM1130.8 1435.7H1041.9V1334.8H1130.8V1435.7ZM1130.8 1331.8H1041.9V1230.9H1130.8V1331.8ZM1130.8 1227.9H1041.9V1127H1130.8V1227.9ZM1130.8 1124H1041.9V1023.1H1130.8V1124ZM1130.8 1020.1H1041.9V919.2H1130.8V1020.1ZM1130.8 916.2H1041.9V815.3H1130.8V916.2ZM1130.8 812.3H1041.9V711.4H1130.8V812.3ZM1130.8 708.4H1041.9V607.5H1130.8V708.4ZM1130.8 604.5H1041.9V503.5H1130.8V604.5ZM1130.8 500.5H1041.9V399.6H1130.8V500.5ZM1130.8 396.6H1041.9V295.7H1130.8V396.6ZM1130.8 292.7H1041.9V191.8H1130.8V292.7ZM1130.8 188.8H1041.9V87.9H1130.8V188.8ZM1222.7 1539.6H1133.8V1438.7H1222.7V1539.6ZM1222.7 1435.7H1133.8V1334.8H1222.7V1435.7ZM1222.7 1331.8H1133.8V1230.9H1222.7V1331.8ZM1222.7 1227.9H1133.8V1127H1222.7V1227.9ZM1222.7 1124H1133.8V1023.1H1222.7V1124ZM1222.7 1020.1H1133.8V919.2H1222.7V1020.1ZM1222.7 916.2H1133.8V815.3H1222.7V916.2ZM1222.7 812.3H1133.8V711.4H1222.7V812.3ZM1222.7 708.4H1133.8V607.5H1222.7V708.4ZM1222.7 604.5H1133.8V503.5H1222.7V604.5ZM1222.7 500.5H1133.8V399.6H1222.7V500.5ZM1222.7 396.6H1133.8V295.7H1222.7V396.6ZM1222.7 292.7H1133.8V191.8H1222.7V292.7ZM1222.7 188.8H1133.8V87.9H1222.7V188.8ZM1314.6 1539.6H1225.7V1438.7H1314.6V1539.6ZM1314.6 1435.7H1225.7V1334.8H1314.6V1435.7ZM1314.6 1331.8H1225.7V1230.9H1314.6V1331.8ZM1314.6 1227.9H1225.7V1127H1314.6V1227.9ZM1314.6 1124H1225.7V1023.1H1314.6V1124ZM1314.6 1020.1H1225.7V919.2H1314.6V1020.1ZM1314.6 916.2H1225.7V815.3H1314.6V916.2ZM1314.6 812.3H1225.7V711.4H1314.6V812.3ZM1314.6 708.4H1225.7V607.5H1314.6V708.4ZM1314.6 604.5H1225.7V503.5H1314.6V604.5ZM1314.6 500.5H1225.7V399.6H1314.6V500.5ZM1314.6 396.6H1225.7V295.7H1314.6V396.6ZM1314.6 292.7H1225.7V191.8H1314.6V292.7ZM1314.6 188.8H1225.7V87.9H1314.6V188.8Z"
        fill="url(#paint0_radial_4830_21534)"
      />
      <defs>
        <radialGradient
          id="paint0_radial_4830_21534"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(672.779 813.774) scale(783.249 783.249)"
        >
          <stop offset="0.14" stop-color="white" />
          <stop offset="0.77" stop-color="#F5F8FE" />
        </radialGradient>
      </defs>
    </svg>
  </div>

  <div class="z-30 absolute top-[13%] lg:top-[4%]">
    <div class="mb-10 ml-[5%] lg:ml-0 flex w-full items-center justify-start lg:justify-center">
      <a
        target="_blank"
        rel="noopener noreferrer nofollow"
        href="/github"
        style="color: rgb(75, 85, 99);"
        class="rounded-full border-2 border-[#C2D2FF] px-4 py-1 text-sm font-medium bg-[#DCE5FF] text-[#4B5563]"
        >Give us a <span class="text-blue-700">star</span> on github</a
      >
    </div>

    <div class="justify-between w-[90%] absolute top-[3%] left-[4%] hidden lg:flex">
      {#if animate}
        <div class="relative" transition:fly={{ y: 100, delay: 0, easing: sineInOut }}>
          <a
            href="/#collaboration"
            class="px-6 py-2 border-[1.5px] border-[#3ADFEC] rounded-[4px] text-[#3ADFEC] text-lg font-bold"
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
      {/if}

      {#if animate}
        <div class="relative" transition:fly={{ x: 100, delay: 50, easing: sineInOut }}>
          <a
            href="/github"
            target="_blank"
            class="px-6 py-2 border-[1.5px] border-[#BF0696] rounded-[4px] text-[#BF0696] text-lg font-bold"
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

    <h1
      class="mx-auto w-[89%] pr-20 lg:pr-0 lg:w-[50%] text-left lg:text-center font-bold md:leading-[1.5] text-slate-900 text-5xl lg:text-7xl"
    >
      Launch Your Online Bootcamp <span class="text-blue-700">In Minutes </span>
    </h1>

    <p class="text-md mx-auto mt-10 px-4 text-slate-700 md:text-lg lg:mt-6 lg:w-[42%] lg:p-0">
      Meet a better collaboration tool for teachers and students. ClassroomIO is a no-code tool that
      allows you build and scale your own teaching platform with ease.
    </p>

    <div class="justify-between w-[90%] absolute top-[25%] left-[4%] hidden lg:flex">
      {#if animate}
        <div class="relative" transition:fly={{ x: -100, delay: 100, easing: sineInOut }}>
          <a
            href="/#customization"
            class="px-6 py-2 border-[1.5px] border-[#0233BD] rounded-[4px] text-[#0233BD] text-lg font-bold"
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
      {/if}

      {#if animate}
        <div class="relative" transition:fly={{ y: 100, delay: 150, easing: sineInOut }}>
          <a
            href="/#ai"
            class="px-6 py-2 border-[1.5px] border-[#9747FF] rounded-[4px] text-[#9747FF] text-lg font-bold"
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
</div>
