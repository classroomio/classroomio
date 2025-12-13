<script lang="ts">
  import { page } from '$app/state';
  import * as NavigationMenu from '@cio/ui/base/navigation-menu';
  import CourseIcon from '$lib/Icons/CourseIcon.svelte';
  import ChevronDown from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import CloseLarge from 'carbon-icons-svelte/lib/CloseLarge.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import MapCenter from 'carbon-icons-svelte/lib/MapCenter.svelte';
  import TextAlignJustify from 'carbon-icons-svelte/lib/TextAlignJustify.svelte';
  import { fly } from 'svelte/transition';
  import { CostTotal, GameConsole, LicenseDraft, ProgressBarRound, Time } from 'carbon-icons-svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  export let stars: number;

  let showDrawer = false;
  let showSolutions = false;
  let activeLink = '';

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
      subtitle: 'Keep your team in sync.',
      icon: 'training'
    },
    {
      key: 'bootcamps',
      title: 'Bootcamps',
      subtitle: 'Drive student satisfaction.',
      icon: 'bootcamp'
    },
    {
      key: 'customer-education',
      title: 'Customer Education',
      subtitle: 'Teach customers your product.',
      icon: 'education'
    }
  ];

  const freeTools = [
    {
      key: 'progress',
      title: 'Progress Tracker',
      subtitle: 'Monitor learning journeys.',
      icon: 'progress'
    },
    {
      key: 'pomodoro',
      title: 'Pomodoro Timer',
      subtitle: 'Boost focus and productivity.',
      icon: 'time'
    },
    {
      key: 'name-picker',
      title: 'Name Picker',
      subtitle: 'Randomly select names.',
      icon: 'license'
    },
    {
      key: 'stopwatch',
      title: 'Activity Stopwatch',
      subtitle: 'Track time accurately.',
      icon: 'cost'
    },
    {
      key: 'tic-tac-toe',
      title: 'Tic Tac Toe',
      subtitle: 'Play the classic game.',
      icon: 'game'
    }
  ];

  type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
    title: string;
    href: string;
    subtitle: string;
    icon: string;
  };

  $: activeLink = page.url.pathname;
  $: activeHash = page.url.hash;
  $: isSolutionsActive = solutions.some((s) => activeHash.includes(s.key));
</script>

{#snippet ListItem({ title, subtitle, href, icon, class: className, ...restProps }: ListItemProps)}
  <li>
    <NavigationMenu.Link>
      {#snippet child()}
        <a
          {href}
          class="flex w-full flex-row items-center rounded-lg p-2 no-underline transition-colors duration-200 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none {className}"
          {...restProps}
        >
          <div class="shrink-0">
            {#if icon === 'training'}
              <CourseIcon />
            {:else if icon === 'bootcamp'}
              <MapCenter size={24} />
            {:else if icon === 'education'}
              <ForumIcon size={24} />
            {:else if icon === 'progress'}
              <ProgressBarRound size={24} />
            {:else if icon === 'time'}
              <Time size={24} />
            {:else if icon === 'license'}
              <LicenseDraft size={24} />
            {:else if icon === 'cost'}
              <CostTotal size={24} />
            {:else if icon === 'game'}
              <GameConsole size={24} />
            {/if}
          </div>
          <div class="ml-3 text-start">
            <h3 class="text-sm font-semibold leading-none text-gray-700">
              {title}
            </h3>
            <p class="mt-1 text-sm font-normal leading-snug text-gray-600">
              {subtitle}
            </p>
          </div>
        </a>
      {/snippet}
    </NavigationMenu.Link>
  </li>
{/snippet}

<section class="z-3005 fixed top-0 w-full">
  <div class="mx-auto flex w-[80%] items-center justify-between gap-20 px-5 py-6 md:px-12">
    <a href="/" class="w-[10%]">
      <div class="flex w-full items-center">
        <img loading="lazy" width="28" height="28" src="/logo-512.png" alt="classroomio logo" class="w-6 md:w-7" />
        <h1 class="ml-2 text-xs font-medium md:text-base">ClassroomIO</h1>
      </div>
    </a>

    <NavigationMenu.Root class="hidden rounded-lg bg-white p-1 md:hidden lg:block">
      <NavigationMenu.List class="flex w-full items-center justify-center gap-1">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger
            class="flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium text-gray-800 transition-all duration-200 hover:bg-gray-100 data-[state=open]:bg-gray-100"
          >
            <a href="/" class="no-underline"> Solutions </a>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul class="grid w-[560px] grid-cols-2 gap-2 p-2">
              {#each solutions as solution}
                {@render ListItem({
                  href: `/${solution.key}`,
                  title: solution.title,
                  subtitle: solution.subtitle,
                  icon: solution.icon
                })}
              {/each}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger
            class="flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium text-gray-800 transition-all duration-200 hover:bg-gray-100 data-[state=open]:bg-gray-100"
          >
            <a href="/tools" class="no-underline"> Free Tools </a>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul class="grid w-[560px] grid-cols-2 gap-2 p-2">
              {#each freeTools as tool}
                {@render ListItem({
                  href: `/tools/${tool.key}`,
                  title: tool.title,
                  subtitle: tool.subtitle,
                  icon: tool.icon
                })}
              {/each}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link>
            {#snippet child()}
              <a
                href="/blog"
                class="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-800 no-underline transition-all duration-200 hover:bg-gray-100 {activeLink.startsWith(
                  '/blog'
                )
                  ? 'bg-gray-100'
                  : ''}"
              >
                Blog
              </a>
            {/snippet}
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link>
            {#snippet child()}
              <a
                href="/pricing"
                class="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-800 no-underline transition-all duration-200 hover:bg-gray-100 {activeLink.startsWith(
                  '/pricing'
                )
                  ? 'bg-gray-100'
                  : ''}"
              >
                Pricing
              </a>
            {/snippet}
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>

    <div class="hidden flex-row items-center justify-between gap-3 md:hidden lg:flex">
      <a href="/discord" target="_blank" class="flex items-center transition-opacity duration-200 hover:opacity-80">
        <img loading="lazy" alt="discord logo" src="/discord-blue.png" class="h-5 w-6 cursor-pointer" />
      </a>
      <div class="flex items-center">
        <a
          href="/github"
          target="_blank"
          class="group flex items-center gap-1.5 rounded-md p-2 transition-all duration-200 ease-in-out hover:bg-gray-100"
        >
          <img
            loading="lazy"
            alt="github logo"
            src="/github-mark.png"
            class="h-5 w-5 cursor-pointer transition-transform duration-200 group-hover:scale-110"
          />
          <span
            class="text-sm font-medium leading-none text-gray-600 transition-colors duration-200 group-hover:text-black"
          >
            {stars}
          </span>
        </a>
      </div>
      <a
        class="text-sm font-medium transition-opacity duration-200 after:ml-2 after:content-['→'] hover:opacity-80"
        href="https://app.classroomio.com"
      >
        Dashboard
      </a>
    </div>

    <button type="button" aria-label="Hamburger Menu" class="block md:block lg:hidden" on:click={handleShowSolutions}>
      <TextAlignJustify size={24} />
    </button>

    {#if showSolutions}
      <div
        in:fly={{ x: 20, duration: 700 }}
        out:fly={{ x: 20, duration: 400 }}
        class="absolute right-0 top-0 h-screen w-[60%] border-2 bg-white px-3 pb-2 pt-3 sm:block md:w-[40%] md:p-7 lg:hidden"
      >
        <div class="mb-5 flex justify-between py-2">
          <img loading="lazy" width="20" height="20" src="/logo-512.png" alt="classroomio logo" class="w-[15%]" />
          <button class="mr-5" on:click={handleShowSolutions}>
            <CloseLarge size={24} />
          </button>
        </div>
        <nav>
          <ul class="flex w-full flex-col items-center justify-between lg:flex-row">
            <li class="w-full cursor-pointer text-sm font-semibold text-gray-800 md:text-lg">
              <button
                class="flex w-full items-center justify-between rounded-lg px-4 py-3 transition-all duration-200 hover:bg-gray-100"
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
                        class="rounded-lg py-2.5 pl-5 text-xs font-normal text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                      >
                        {solution.title}
                      </p>
                    </a>
                  {/each}
                </div>
              {/if}
            </li>
            <a
              class="w-full cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-100 md:text-lg"
              on:click={handleShowSolutions}
              href="/tools"
            >
              <li>Free Tools</li>
            </a>
            <a
              class="w-full cursor-pointer rounded-md px-4 py-3 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-100 md:text-lg"
              on:click={() => {
                handleShowSolutions();
              }}
              class:active={activeLink.startsWith('/blog')}
              href="/blog"
            >
              <li>Blog</li>
            </a>
            <a
              class="w-full cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-100 md:text-lg"
              on:click={() => {
                handleShowSolutions();
              }}
              href="/pricing"
              class:active={activeLink.startsWith('/pricing')}
            >
              <li>Pricing</li>
            </a>
            <a
              class="w-full cursor-pointer rounded-md px-4 py-3 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-100 md:text-lg"
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
        <div class="mt-5 flex flex-col items-start gap-y-2 border-t pt-5">
          <a
            href="/discord"
            target="_blank"
            class="flex w-full items-center rounded-md px-4 py-4 text-left text-sm transition-all duration-200 hover:bg-gray-100 md:text-lg"
          >
            <img loading="lazy" alt="discord logo" src="/discord-blue.png" class="mr-2 h-5 w-6 cursor-pointer" />
            <span>Discord</span>
          </a>
          <a
            href="/github"
            target="_blank"
            class="group flex w-full items-center rounded-md px-4 py-4 text-left text-sm transition-all duration-200 hover:bg-gray-100 md:text-lg"
          >
            <img
              loading="lazy"
              alt="github logo"
              src="/github-mark.png"
              class="h-5 w-5 cursor-pointer transition-transform duration-200 group-hover:scale-110"
            />
            <span class="ml-3 transition-colors duration-200 group-hover:text-black">Github</span>
            <span class="ml-1 text-sm font-medium text-gray-600 transition-colors duration-200 group-hover:text-black"
              >({stars})</span
            >
          </a>
          <a
            class="w-full rounded-md px-4 py-4 text-left text-sm font-semibold transition-all duration-200 after:ml-2 after:content-['→'] hover:bg-gray-100 md:text-lg"
            href="https://app.classroomio.com"
          >
            Dashboard
          </a>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .active {
    background-color: #f3f4f6;
    border-radius: 6px;
  }
</style>
