<script lang="ts">
  import BookOpen from '@lucide/svelte/icons/book-open';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Component from '@lucide/svelte/icons/component';
  import Github from '@lucide/svelte/icons/github';
  import LocateFixed from '@lucide/svelte/icons/locate-fixed';
  import Menu from '@lucide/svelte/icons/menu';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import Server from '@lucide/svelte/icons/server';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Webhook from '@lucide/svelte/icons/webhook';
  import X from '@lucide/svelte/icons/x';
  import { page } from '$app/state';
  import { fly } from 'svelte/transition';
  import type { HTMLAttributes } from 'svelte/elements';
  import * as NavigationMenu from '@cio/ui/base/navigation-menu';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Waves } from '@cio/ui/custom/animation';
  import { cn } from '@cio/ui/tools';

  let { stars }: { stars: number } = $props();

  type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
    title: string;
    href: string;
    subtitle: string;
    key: string;
  };

  type NavCollectionItem = {
    key: string;
    title: string;
    subtitle: string;
    href: string;
  };

  type NavItem = {
    key: string;
    title: string;
    href?: string;
    badge?: string;
    items?: NavCollectionItem[];
  };

  let expandedMobileGroup = $state<string | null>(null);
  let showSolutions = $state(false);
  let activeLink = $derived(page.url.pathname);

  function handleMobileGroupToggle(groupKey: string) {
    expandedMobileGroup = expandedMobileGroup === groupKey ? null : groupKey;
  }

  function handleShowSolutions() {
    showSolutions = !showSolutions;

    if (!showSolutions) {
      expandedMobileGroup = null;
    }
  }

  function closeMobileMenu() {
    showSolutions = false;
    expandedMobileGroup = null;
  }

  const solutions: NavCollectionItem[] = [
    {
      key: 'customer-education',
      title: 'Customer Education',
      subtitle: 'Customer academies for SaaS.',
      href: '/customer-education'
    },
    {
      key: 'compliance-training',
      title: 'Compliance Training',
      subtitle: 'Turn policies and SOPs into proof.',
      href: '/compliance-training'
    },
    {
      key: 'partner-training',
      title: 'Partner Training',
      subtitle: 'A separate academy for your channel.',
      href: '/partner-training'
    }
  ];

  const developers: NavCollectionItem[] = [
    {
      key: 'automation',
      title: 'Automation',
      subtitle: 'API, Webhooks, and MCP server.',
      href: '/automation'
    },
    {
      key: 'self-hosting',
      title: 'Self-hosting & Docs',
      subtitle: 'Run ClassroomIO in your own VPC.',
      href: 'https://classroomio.com/docs'
    },
    {
      key: 'help',
      title: 'Help Center',
      subtitle: 'Guides for running your academy.',
      href: 'https://classroomio.com/help'
    },
    {
      key: 'mcp-recipes',
      title: 'MCP Recipes',
      subtitle: 'Ready-to-run agent prompts.',
      href: '/mcp-recipes'
    },
    {
      key: 'storybook',
      title: 'Storybook',
      subtitle: 'Browse and reuse UI components.',
      href: 'https://ui.classroomio.dev'
    }
  ];

  const navItems: NavItem[] = [
    {
      key: 'solutions',
      title: 'Solutions',
      href: '/',
      items: solutions
    },
    {
      key: 'developers',
      title: 'Resources',
      href: '/automation',
      items: developers
    },
    {
      key: 'changelog',
      title: "What's new",
      href: '/changelog',
      badge: 'New'
    },
    {
      key: 'blog',
      title: 'Blog',
      href: '/blog'
    },
    {
      key: 'pricing',
      title: 'Pricing',
      href: '/pricing'
    }
  ];

  let isSolutionsActive = $derived(!!solutions.some((s) => activeLink.includes(s.key)));
  let isDevelopersActive = $derived(!!developers.some((d) => activeLink.includes(d.key)));

  function isNavItemActive(navItem: NavItem) {
    if (navItem.key === 'solutions') {
      return isSolutionsActive;
    }

    if (navItem.key === 'developers') {
      return isDevelopersActive;
    }

    return navItem.href ? activeLink.startsWith(navItem.href) : false;
  }
</script>

{#snippet nav_badge(label: string, positionClass: string)}
  <Badge
    variant="default"
    class={cn(
      'pointer-events-none rotate-5 bg-linear-to-r from-pink-500 to-orange-500 px-1.5 py-0 shadow-md',
      positionClass
    )}
  >
    <Sparkles size={8} class="mr-0.5 text-white" />
    <span class="text-[10px] font-bold text-white">{label}</span>
  </Badge>
{/snippet}

{#snippet list_item({ title, subtitle, href, key, class: className, ...restProps }: ListItemProps)}
  <li>
    <NavigationMenu.Link>
      {#snippet child()}
        <a
          {href}
          class="flex w-full flex-row items-center gap-3 rounded-lg p-2.5 no-underline transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none {className} [&_svg]:stroke-blue-600"
          {...restProps}
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-100 [&_svg]:size-5 [&_svg]:stroke-[1.8]"
          >
            {#if key === 'compliance-training'}
              <LibraryBigIcon size={24} />
            {:else if key === 'partner-training'}
              <LocateFixed size={24} />
            {:else if key === 'customer-education'}
              <MessagesSquare size={24} />
            {:else if key === 'automation'}
              <Webhook size={24} />
            {:else if key === 'self-hosting'}
              <Server size={24} />
            {:else if key === 'help'}
              <BookOpen size={24} />
            {:else if key === 'mcp-recipes'}
              <Sparkles size={24} />
            {:else if key === 'github'}
              <Github size={24} />
            {:else if key === 'storybook'}
              <Component size={24} />
            {/if}
          </div>
          <div class="text-start">
            <p class="text-sm font-medium">
              {title}
            </p>
            <p class="ui:text-muted-foreground mt-0.5 text-[13px] leading-snug">
              {subtitle}
            </p>
          </div>
        </a>
      {/snippet}
    </NavigationMenu.Link>
  </li>
{/snippet}

<section class="fixed top-0 z-50 w-full border-b bg-white">
  <div
    class="lg:h-nav mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-10 px-4 md:px-8 xl:px-14"
  >
    <a href="/" class="shrink-0">
      <div class="flex w-full items-center">
        <img loading="lazy" width="28" height="28" src="/logo-512.png" alt="classroomio logo" class="w-7" />
        <h1 class="ml-2 text-base font-medium">ClassroomIO</h1>
      </div>
    </a>

    <section class="hidden! lg:block!">
      <NavigationMenu.Root class="p-1">
        <NavigationMenu.List class="flex w-full items-center justify-center gap-1">
          {#each navItems as navItem}
            <NavigationMenu.Item>
              {#if navItem.items}
                <NavigationMenu.Trigger
                  class={cn(
                    'flex cursor-pointer items-center rounded-sm px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 data-[state=open]:bg-gray-100',
                    isNavItemActive(navItem) && 'bg-gray-100!'
                  )}
                >
                  <a href={navItem.href} class="no-underline">{navItem.title}</a>
                </NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <ul class="grid w-[640px] grid-cols-2 gap-1 p-3">
                    {#each navItem.items as item}
                      {@render list_item({
                        href: item.href,
                        title: item.title,
                        subtitle: item.subtitle,
                        key: item.key
                      })}
                    {/each}
                  </ul>
                </NavigationMenu.Content>
              {:else}
                <NavigationMenu.Link>
                  {#snippet child()}
                    <a
                      href={navItem.href}
                      class={cn(
                        'relative cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium text-gray-800 no-underline transition-colors hover:bg-gray-100',
                        isNavItemActive(navItem) && 'bg-gray-100'
                      )}
                    >
                      {navItem.title}
                      {#if navItem.badge}
                        {@render nav_badge(navItem.badge, 'absolute -top-2.5 -right-1 z-10')}
                      {/if}
                    </a>
                  {/snippet}
                </NavigationMenu.Link>
              {/if}
            </NavigationMenu.Item>
          {/each}
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </section>

    <div class="hidden! flex-row items-center justify-between gap-3 lg:flex!">
      <a href="/discord" target="_blank" class="flex items-center transition-opacity duration-200 hover:opacity-80">
        <img
          loading="lazy"
          alt="discord logo"
          src="https://assets.cdn.clsrio.com/www/home/discord-blue.png"
          class="h-5 w-6 cursor-pointer"
        />
      </a>
      <div class="flex items-center">
        <a
          href="/github"
          target="_blank"
          class="group flex items-center gap-1.5 rounded-sm p-2 transition-colors hover:bg-gray-100"
        >
          <img
            loading="lazy"
            alt="github logo"
            src="https://assets.cdn.clsrio.com/www/home/github-mark.png"
            class="h-5 w-5 cursor-pointer transition-transform duration-200 group-hover:scale-110"
          />
          <span
            class="text-sm leading-none font-medium text-gray-600 transition-colors duration-200 group-hover:text-black"
          >
            {stars}
          </span>
        </a>
      </div>
      <Button
        href="https://app.classroomio.com"
        size="sm"
        class="ui:bg-primary ui:text-primary-foreground relative overflow-hidden border-0"
      >
        <Waves
          lineColor="rgba(255,255,255,0.55)"
          xGap={8}
          yGap={12}
          waveAmpX={18}
          waveAmpY={9}
          waveSpeedX={0.04}
          waveSpeedY={0.02}
        />
        <span class="relative z-10">Dashboard</span>
        <ArrowRightIcon class="relative z-10" />
      </Button>
    </div>

    <button type="button" aria-label="Hamburger Menu" class="shrink-0 lg:hidden!" onclick={handleShowSolutions}>
      <Menu size={24} />
    </button>

    {#if showSolutions}
      <div
        in:fly={{ x: 20, duration: 700 }}
        out:fly={{ x: 20, duration: 400 }}
        class="absolute top-0 right-0 h-screen w-[60%] border-2 bg-white px-3 pt-3 pb-2 sm:block md:w-[40%] md:p-7 lg:hidden"
      >
        <div class="mb-5 flex justify-between py-2">
          <img loading="lazy" width="20" height="20" src="/logo-512.png" alt="classroomio logo" class="w-[15%]" />
          <button class="mr-5" onclick={handleShowSolutions}>
            <X size={24} />
          </button>
        </div>
        <nav>
          <ul class="flex w-full flex-col items-center justify-between lg:flex-row">
            {#each navItems as navItem}
              <li class="w-full cursor-pointer text-sm font-semibold text-gray-800 md:text-lg">
                {#if navItem.items}
                  <button
                    class={cn(
                      'flex w-full items-center justify-between rounded-lg px-4 py-3 transition-all duration-200 hover:bg-gray-100',
                      isNavItemActive(navItem) && 'bg-gray-100'
                    )}
                    onclick={() => {
                      handleMobileGroupToggle(navItem.key);
                    }}
                  >
                    {navItem.title}
                    <ChevronDown />
                  </button>
                  {#if expandedMobileGroup === navItem.key}
                    <div in:fly={{ y: -20, duration: 700 }} out:fly={{ y: 20, duration: 400 }}>
                      {#each navItem.items as item}
                        <a href={item.href} onclick={closeMobileMenu}>
                          <p
                            class="rounded-lg py-2.5 pl-5 text-xs font-normal text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                          >
                            {item.title}
                          </p>
                        </a>
                      {/each}
                    </div>
                  {/if}
                {:else}
                  <a
                    class={cn(
                      'block w-full rounded-md px-4 py-3 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-100 md:text-lg',
                      isNavItemActive(navItem) && 'bg-gray-100'
                    )}
                    onclick={closeMobileMenu}
                    href={navItem.href}
                  >
                    <span class="inline-flex items-center gap-2">
                      {navItem.title}
                      {#if navItem.badge}
                        {@render nav_badge(navItem.badge, 'relative')}
                      {/if}
                    </span>
                  </a>
                {/if}
              </li>
            {/each}
          </ul>
        </nav>
        <div class="mt-5 flex flex-col items-start gap-y-2 border-t pt-5">
          <a
            href="/discord"
            target="_blank"
            class="flex w-full items-center rounded-md px-4 py-4 text-left text-sm transition-all duration-200 hover:bg-gray-100 md:text-lg"
          >
            <img
              loading="lazy"
              alt="discord logo"
              src="https://assets.cdn.clsrio.com/www/home/discord-blue.png"
              class="mr-2 h-5 w-6 cursor-pointer"
            />
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
              src="https://assets.cdn.clsrio.com/www/home/github-mark.png"
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
