<script>
  import { createDropdownMenu, melt } from '@melt-ui/svelte';
  import ChevronDown from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import TextAlignJustify from 'carbon-icons-svelte/lib/TextAlignJustify.svelte';
  import CloseLarge from 'carbon-icons-svelte/lib/CloseLarge.svelte';
  import { fly } from 'svelte/transition';
  import MachineLearningModel from 'carbon-icons-svelte/lib/MachineLearningModel.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import CourseIcon from '$lib/Icons/CourseIcon.svelte';
  import MapCenter from 'carbon-icons-svelte/lib/MapCenter.svelte';

  let showsubNav = false;
  let showNav = false;

  const {
    elements: { menu, item, trigger, arrow },
  } = createDropdownMenu({
    positioning: {
      placement: 'bottom-start',
      fitViewport: true,
    },
  });

  function handleShow() {
    showsubNav = !showsubNav;
  }

  function handleShowNav() {
    showNav = !showNav;
  }

  function scroll(key = '') {
    const el = document.getElementById(key);
    setTimeout(() => {
      el?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }, 50);
  }

  const superpowers = [
    {
      key: 'coursemanagement',
      title: 'Course Management',
      subtitle: 'Advanced course management tools ',
    },
    {
      key: 'customization',
      title: 'Customizations',
      subtitle: 'Customize your classroom to your needs',
    },
    {
      key: 'collaboration',
      title: 'Forum',
      subtitle: 'Seamlessly collaborate with your students',
    },
    {
      key: 'ai',
      title: 'AI Lesson Planner',
      subtitle: "10x Educator's productivity with AI",
    },
  ];
</script>

<div
  class="flex w-full justify-between items-center py-6 border-b-[1px] md:px-12 px-5 fixed top-0 z-[3000] filter backdrop-blur-xl shadow-sm"
>
  <a href="/">
    <div class="flex items-center">
      <img src="/logo-512.png" alt="classroomio logo" class="w-10 h-10" />
      <h1 class="text-xs md:text-lg font-medium ml-2">ClassroomIO</h1>
    </div>
  </a>

  <nav class="w-[40%] hidden md:hidden lg:block">
    <ul class="flex items-center justify-between w-full gap-2">
      <!--  -->
      <li class="text-gray-800 font-semibold text-sm cursor-pointer">
        <button use:melt={$trigger} class="flex items-center"
          >Our Superpowers <ChevronDown class="ml-2" /></button
        >
        <div
          use:melt={$menu}
          class="w-[28%] border px-5 py-5 rounded-[30px] shadow-slate-700 mt-2 z-[3001] ml-[-30px] bg-white"
        >
          {#each superpowers as superpower}
            <button
              use:melt={$item}
              class="flex justify-between items-center w-full rounded-lg hover:bg-slate-100 p-5 mb-4"
              on:m-click={() => scroll(superpower.key)}
            >
              {#if superpower.key === 'coursemanagement'}
                <CourseIcon />
              {:else if superpower.key === 'customization'}
                <MapCenter size={24} />
              {:else if superpower.key === 'collaboration'}
                <ForumIcon size={24} />
              {:else if superpower.key === 'ai'}
                <MachineLearningModel size={24} />
              {/if}
              <div class="w-[86%] text-start">
                <h3 class="font-semibold text-sm text-gray-700">
                  {superpower.title}
                </h3>
                <p class="font-normal text-sm text-gray-600">
                  {superpower.subtitle}
                </p>
              </div>
            </button>
          {/each}

          <div use:melt={$arrow} />
        </div>
      </li>
      <!--  -->
      <a href="#morefeatures">
        <li class="text-gray-800 font-semibold text-sm cursor-pointer">
          More features
        </li>
      </a>
      <a href="#pricing">
        <li class="text-gray-800 font-semibold text-sm cursor-pointer">
          Pricing
        </li>
      </a>
    </ul>
  </nav>

  <div class="justify-between items-center flex-row hidden md:hidden lg:flex">
    <!-- <button
      class="bg-[#1D4EE2] text-white text-sm font-medium px-4 py-1.5 rounded-md mr-5"
    >
      Sign Up
    </button> -->
    <a href="/discord" target="_blank">
      <img
        alt="discord logo"
        src="/discord-blue.png"
        class="w-8 h-6 mr-4 cursor-pointer"
      />
    </a>
    <a href="/github" target="_blank">
      <img
        alt="github logo"
        src="/github-mark.png"
        class="w-6 h-6 mr-4 cursor-pointer"
      />
    </a>
    <button
      class="font-medium text-sm after:content-['→'] after:ml-2"
      data-cal-config={"{'layout':'month_view'}"}
      data-cal-link="classroomio/demo"
    >
      Get a Demo
    </button>
  </div>

  <button class="block md:block lg:hidden" on:click={handleShowNav}
    ><TextAlignJustify size={24} /></button
  >

  <!-- burger menu -->
  {#if showNav}
    <div
      in:fly={{ x: 20, duration: 700 }}
      out:fly={{ x: 20, duration: 400 }}
      class="w-[60%] md:w-[40%] h-[100vh] border-2 sm:block lg:hidden px-3 pt-3 pb-2 md:p-7 absolute right-0 top-0 bg-white"
    >
      <div class="flex justify-between py-2 mb-5">
        <img src="/logo-512.png" alt="classroomio logo" class="w-[8%]" />
        <button on:click={handleShowNav}
          ><CloseLarge size={24} class="mr-5" /></button
        >
      </div>
      <nav class="">
        <ul
          class="flex items-center flex-col lg:flex-row justify-between w-full"
        >
          <!--  -->
          <li
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer w-full"
          >
            <button
              class="w-full flex items-center justify-between hover:bg-gray-100 py-3 px-4 rounded-lg"
              on:click={handleShow}
            >
              Our Superpowers <ChevronDown />
            </button>
            {#if showsubNav}
              <div
                in:fly={{ y: -20, duration: 700 }}
                out:fly={{ y: 20, duration: 400 }}
              >
                {#each superpowers as superpower}
                  <a href="#{superpower.key}">
                    <p
                      class="font-normal text-xs text-gray-700 hover:bg-gray-100 rounded-lg py-2.5 pl-5"
                    >
                      {superpower.title}
                    </p>
                  </a>
                {/each}
              </div>
            {/if}
          </li>
          <!--  -->
          <li
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer hover:bg-gray-100 py-3 px-4 rounded-xl w-full"
          >
            <a href="#morefeatures"> More features </a>
          </li>
          <li
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer hover:bg-gray-100 py-3 px-4 rounded-xl w-full"
          >
            <a href="#pricing"> Pricing </a>
          </li>
        </ul>
      </nav>
      <div class="flex items-start flex-col gap-y-2 mt-5 border-t-[1px] pt-5">
        <!-- <button
          class="text-black font-semibold rounded-md mr-10 w-full text-left py-4 px-4 hover:bg-gray-100 text-sm md:text-lg"
          >Sign Up</button
        > -->
        <a
          href="/discord"
          target="_blank"
          class="flex items-center rounded-md after:ml-2 w-full text-left py-4 px-4 hover:bg-gray-100 text-sm md:text-lg"
        >
          <img
            alt="discord logo"
            src="/discord-blue.png"
            class="w-8 h-6 mr-2 cursor-pointer"
          />
          <span>Discord</span>
        </a>
        <a
          href="/github"
          target="_blank"
          class="flex items-center rounded-md after:ml-2 w-full text-left py-4 px-4 hover:bg-gray-100 text-sm md:text-lg"
        >
          <img
            alt="github logo"
            src="/github-mark.png"
            class="w-6 h-6 mr-3 cursor-pointer"
          />
          <span>Github</span>
        </a>
        <button
          class="font-semibold after:content-['→'] rounded-md after:ml-2 w-full text-left py-4 px-4 hover:bg-gray-100 text-sm md:text-lg"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/demo"
        >
          Get a Demo
        </button>
      </div>
    </div>
  {/if}
</div>
