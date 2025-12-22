<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Gamepad from '@lucide/svelte/icons/gamepad';
  import Hourglass from '@lucide/svelte/icons/hourglass';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import LocateFixed from '@lucide/svelte/icons/locate-fixed';
  import Menu from '@lucide/svelte/icons/menu';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import MousePointerClick from '@lucide/svelte/icons/mouse-pointer-click';
  import Timer from '@lucide/svelte/icons/timer';
  import X from '@lucide/svelte/icons/x';
  import { page } from '$app/state';
  import { fly } from 'svelte/transition';
  import type { HTMLAttributes } from 'svelte/elements';
  import * as NavigationMenu from '@cio/ui/base/navigation-menu';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';


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

  const freeTools = [
    {
      key: 'progress',
      title: 'Progress Tracker',
      subtitle: 'Monitor learning journeys.'
    },
    {
      key: 'pomodoro',
      title: 'Pomodoro Timer',
      subtitle: 'Boost focus and productivity.'
    },
    {
      key: 'name-picker',
      title: 'Name Picker',
      subtitle: 'Randomly select names.'
    },
    {
      key: 'stopwatch',
      title: 'Activity Stopwatch',
      subtitle: 'Track time accurately.'
    },
    {
      key: 'tic-tac-toe',
      title: 'Tic Tac Toe',
      subtitle: 'Play the classic game.'
    }
  ];

  type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
    title: string;
    href: string;
    subtitle: string;
    key: string;
  };

  $: activeLink = page.url.pathname;
  $: activeHash = page.url.hash;
  $: isSolutionsActive = solutions.some((s) => activeHash.includes(s.key));
</script>

{#snippet list_item({ title, subtitle, href, key, class: className, ...restProps }: ListItemProps)}
  <li>
    <NavigationMenu.Link>
      {#snippet child()}
        <a
          {href}
          class="flex w-full flex-row items-center rounded-lg p-2 no-underline transition-colors duration-200 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none {className} [&_svg]:stroke-blue-600"
          {...restProps}
        >
          <div class="shrink-0">
            {#if key === 'employee-training'}
              <LibraryBigIcon size={24} />
            {:else if key === 'bootcamps'}
              <LocateFixed size={24} />
            {:else if key === 'customer-education'}
              <MessagesSquare size={24} />
            {:else if key === 'progress'}
              <LoaderCircle size={24} />
            {:else if key === 'pomodoro'}
              <Hourglass size={24} />
            {:else if key === 'name-picker'}
              <MousePointerClick size={24} />
            {:else if key === 'stopwatch'}
              <Timer size={24} />
            {:else if key === 'tic-tac-toe'}
              <Gamepad size={24} />
            {/if}
          </div>
          <div class="ml-3 text-start">
            <p class="text-sm">
              {title}
            </p>
            <p class="mt-1 text-xs ui:text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </a>
      {/snippet}
    </NavigationMenu.Link>
  </li>
{/snippet}

<section class="z-50 fixed top-0 w-full bg-white border-b">
  <div class="mx-auto flex w-full items-center justify-between gap-20 py-1 lg:w-[90%] lg:px-0 px-4">
    <a href="/" class="w-[10%]">
      <div class="flex w-full items-center">
        <img loading="lazy" width="28" height="28" src="/logo-512.png" alt="classroomio logo" class="w-6 md:w-7" />
        <h1 class="ml-2 text-xs font-medium md:text-base">ClassroomIO</h1>
      </div>
    </a>

    <section class="hidden lg:block">
      <NavigationMenu.Root class="rounded-lg bg-white p-1">
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
                  {@render list_item({
                    href: `/${solution.key}`,
                    title: solution.title,
                    subtitle: solution.subtitle,
                    key: solution.key
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
                  {@render list_item({
                    href: `/tools/${tool.key}`,
                    title: tool.title,
                    subtitle: tool.subtitle,
                    key: tool.key
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
    </section>

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
      <Menu size={24} />
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
            <X size={24} />
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
