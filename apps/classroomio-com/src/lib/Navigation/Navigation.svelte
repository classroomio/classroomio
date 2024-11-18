<script lang="ts">
  import ChevronDown from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import TextAlignJustify from 'carbon-icons-svelte/lib/TextAlignJustify.svelte';
  import CloseLarge from 'carbon-icons-svelte/lib/CloseLarge.svelte';
  import { fly } from 'svelte/transition';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import CourseIcon from '$lib/Icons/CourseIcon.svelte';
  import MapCenter from 'carbon-icons-svelte/lib/MapCenter.svelte';
  import { page } from '$app/stores';

  let showDrawer = false;
  let showSolutions = false;
  let activeLink = '';
  let closeTimeout: NodeJS.Timeout;

  function closeSolutions() {
    closeTimeout = setTimeout(() => {
      showSolutions = false;
    }, 100);
  }
  function resetCloseTimeout() {
    clearTimeout(closeTimeout);
  }

  function handleShowDrawer() {
    showDrawer = !showDrawer;
  }

  function handleShowSolutions() {
    showSolutions = !showSolutions;
  }

  const solutions = [
    {
      key: 'employee-training',
      title: 'Employee Training',
      subtitle: 'Keep your team in sync.'
    },
    {
      key: 'bootcamps',
      title: 'Bootcamps',
      subtitle: 'Drive student satisfaction.'
    },
    {
      key: 'customer-education',
      title: 'Customer Education',
      subtitle: 'Teach customers your product.'
    }
  ];

  $: activeLink = $page.url.pathname;
  $: activeHash = $page.url.hash;
  $: isSolutionsActive = solutions.some((s) => activeHash.includes(s.key));
</script>

<div
  class="flex w-full justify-between items-center py-6 border-b-[1px] md:px-12 px-5 fixed top-0 z-[3000] filter backdrop-blur-xl shadow-sm bg-white"
>
  <a href="/" class="w-[10%]">
    <div class="flex items-center w-full">
      <img
        loading="lazy"
        width="28"
        height="28"
        src="/logo-512.png"
        alt="classroomio logo"
        class="w-6 md:w-10"
      />
      <h1 class="text-xs md:text-lg font-medium ml-2">ClassroomIO</h1>
    </div>
  </a>

  <nav class="w-[50%] hidden md:hidden lg:block">
    <ul class="flex items-center justify-between w-full gap-2">
      <li class="text-gray-800 font-semibold text-sm cursor-pointer relative">
        <button
          on:focus={() => (showSolutions = true)}
          on:mouseenter={() => (showSolutions = true)}
          on:mouseleave={closeSolutions}
          class="flex items-center hover:bg-gray-100 {showSolutions &&
            'bg-gray-100'} px-4 py-2 rounded-md"
          on:click={() => (showSolutions = !showSolutions)}
          class:active={isSolutionsActive}
        >
          <span class="mr-2">Solutions</span>
          <ChevronDown size={16} />
        </button>
        {#if showSolutions}
          <button
            class="absolute w-[20rem] top-10 -left-10 border rounded-lg px-2 py-4 shadow-slate-700 z-[3001] bg-white flex flex-col gap-3"
            on:mouseenter={resetCloseTimeout}
            on:mouseleave={() => (showSolutions = false)}
          >
            {#each solutions as solution}
              <a
                class="flex justify-between items-center w-full rounded-lg hover:bg-gray-100 p-2"
                href="/{solution.key}"
                on:click={() => (showSolutions = false)}
              >
                {#if solution.key === 'employee-training'}
                  <CourseIcon />
                {:else if solution.key === 'bootcamps'}
                  <MapCenter size={24} />
                {:else if solution.key === 'customer-education'}
                  <ForumIcon size={24} />
                {/if}

                <div class="w-[84%] text-start">
                  <h3 class="font-semibold text-sm text-gray-700">
                    {solution.title}
                  </h3>
                  <p class="font-normal text-sm text-gray-600">
                    {solution.subtitle}
                  </p>
                </div>
              </a>
            {/each}
          </button>
        {/if}
      </li>
      <a
        href="/tools"
        class="text-gray-800 font-semibold text-sm cursor-pointer"
        class:active={activeLink.startsWith('/tools')}
      >
        <li class="hover:bg-gray-100 px-4 py-2 rounded-md">Free Tools</li>
      </a>

      <a
        href="/blog"
        class="text-gray-800 font-semibold text-sm cursor-pointer"
        class:active={activeLink.startsWith('/blog')}
      >
        <li class="hover:bg-gray-100 px-4 py-2 rounded-md">Blog</li>
      </a>
      <a
        href="/pricing"
        class="text-gray-800 font-semibold text-sm cursor-pointer"
        class:active={activeLink.startsWith('/pricing')}
      >
        <li class="hover:bg-gray-100 px-4 py-2 rounded-md">Pricing</li>
      </a>
    </ul>
  </nav>

  <div class="justify-between items-center flex-row hidden md:hidden lg:flex">
    <a href="/discord" target="_blank">
      <img
        loading="lazy"
        alt="discord logo"
        src="/discord-blue.png"
        class="w-8 h-6 mr-4 cursor-pointer"
      />
    </a>
    <a href="/github" target="_blank">
      <img
        loading="lazy"
        alt="github logo"
        src="/github-mark.png"
        class="w-6 h-6 mr-4 cursor-pointer"
      />
    </a>
    <a
      class="font-medium text-sm after:content-['→'] after:ml-2"
      href="https://app.classroomio.com"
    >
      Dashboard
    </a>
  </div>

  <button
    type="button"
    aria-label="Hamburger Menu"
    class="block md:block lg:hidden"
    on:click={handleShowSolutions}
  >
    <TextAlignJustify size={24} />
  </button>

  {#if showSolutions}
    <div
      in:fly={{ x: 20, duration: 700 }}
      out:fly={{ x: 20, duration: 400 }}
      class="w-[60%] md:w-[40%] h-[100vh] border-2 sm:block lg:hidden px-3 pt-3 pb-2 md:p-7 absolute right-0 top-0 bg-white"
    >
      <div class="flex justify-between py-2 mb-5">
        <img
          loading="lazy"
          width="20"
          height="20"
          src="/logo-512.png"
          alt="classroomio logo"
          class="w-[15%]"
        />
        <button class="mr-5" on:click={handleShowSolutions}>
          <CloseLarge size={24} />
        </button>
      </div>
      <nav>
        <ul class="flex items-center flex-col lg:flex-row justify-between w-full">
          <li class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer w-full">
            <button
              class="w-full flex items-center justify-between hover:bg-gray-100 py-3 px-4 rounded-lg"
              on:click={handleShowDrawer}
              class:active={isSolutionsActive}
            >
              Our Superpowers <ChevronDown />
            </button>
            {#if showDrawer}
              <div in:fly={{ y: -20, duration: 700 }} out:fly={{ y: 20, duration: 400 }}>
                {#each solutions as solution}
                  <a
                    href="/{solution.key}"
                    on:click={() => {
                      handleShowSolutions();
                    }}
                  >
                    <p
                      class="font-normal text-xs text-gray-700 hover:bg-gray-100 rounded-lg py-2.5 pl-5"
                    >
                      {solution.title}
                    </p>
                  </a>
                {/each}
              </div>
            {/if}
          </li>
          <!-- Free Tools -->
          <a
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer hover:bg-gray-100 py-3 px-4 rounded-xl w-full"
            on:click={handleShowSolutions}
            href="/tools"
          >
            <li>Free Tools</li>
          </a>
          <!-- <a
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer hover:bg-gray-100 py-3 px-4 rounded-md w-full"
            on:click={() => {
              handleShowSolutions();
            }}
            class:active={activeLink.startsWith('/docs')}
            href="/docs"
            target="_blank"
          >
            <li>Docs</li>
          </a> -->
          <a
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer hover:bg-gray-100 py-3 px-4 rounded-md w-full"
            on:click={() => {
              handleShowSolutions();
            }}
            class:active={activeLink.startsWith('/blog')}
            href="/blog"
          >
            <li>Blog</li>
          </a>
          <!-- Pricing -->
          <a
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer hover:bg-gray-100 py-3 px-4 rounded-xl w-full"
            on:click={() => {
              handleShowSolutions();
            }}
            href="/pricing"
            class:active={activeLink.startsWith('/pricing')}
          >
            <li>Pricing</li>
          </a>
          <a
            class="text-gray-800 font-semibold text-sm md:text-lg cursor-pointer hover:bg-gray-100 py-3 px-4 rounded-md w-full"
            on:click={() => {
              handleShowSolutions();
            }}
            class:active={activeHash.includes('morefeatures')}
            href="/#morefeatures"
          >
            <li>More features</li>
          </a>
        </ul>
      </nav>
      <div class="flex items-start flex-col gap-y-2 mt-5 border-t-[1px] pt-5">
        <a
          href="/discord"
          target="_blank"
          class="flex items-center rounded-md after:ml-2 w-full text-left py-4 px-4 hover:bg-gray-100 text-sm md:text-lg"
        >
          <img
            loading="lazy"
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
            loading="lazy"
            alt="github logo"
            src="/github-mark.png"
            class="w-6 h-6 mr-3 cursor-pointer"
          />
          <span>Github</span>
        </a>
        <a
          class="font-semibold after:content-['→'] rounded-md after:ml-2 w-full text-left py-4 px-4 hover:bg-gray-100 text-sm md:text-lg"
          href="https://app.classroomio.com"
        >
          Dashboard
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  .active {
    background-color: #f3f4f6;
    border-radius: 6px;
  }
</style>
