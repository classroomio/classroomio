<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import AppWindow from '@lucide/svelte/icons/app-window';
  import Award from '@lucide/svelte/icons/award';
  import Banknote from '@lucide/svelte/icons/banknote';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import ChartNoAxesCombined from '@lucide/svelte/icons/chart-no-axes-combined';
  import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
  import Factory from '@lucide/svelte/icons/factory';
  import FileText from '@lucide/svelte/icons/file-text';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Handshake from '@lucide/svelte/icons/handshake';
  import HeartPulse from '@lucide/svelte/icons/heart-pulse';
  import History from '@lucide/svelte/icons/history';
  import Landmark from '@lucide/svelte/icons/landmark';
  import LayoutTemplate from '@lucide/svelte/icons/layout-template';
  import Map from '@lucide/svelte/icons/map';
  import PlugZap from '@lucide/svelte/icons/plug-zap';
  import Puzzle from '@lucide/svelte/icons/puzzle';
  import Quote from '@lucide/svelte/icons/quote';
  import Server from '@lucide/svelte/icons/server';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Store from '@lucide/svelte/icons/store';
  import UsersRound from '@lucide/svelte/icons/users-round';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import type { Component } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  type NavItem = {
    key: string;
    title: string;
    icon: Component;
    href: string;
    hash?: string;
    description?: string;
    external?: boolean;
  };

  type NavColumn = {
    heading?: string;
    variant?: 'list' | 'chips';
    items: NavItem[];
  };

  type MobileRow =
    | { key: string; kind: 'link'; label: string; href: string; hash?: string }
    | { key: string; kind: 'accordion'; label: string; columns: NavColumn[] };

  const productItems: NavItem[] = [
    {
      key: 'agents',
      title: 'AI Agents',
      icon: Sparkles,
      description: 'Connect Claude, Cursor or any MCP client',
      href: '/ai-agents'
    },
    {
      key: 'academy',
      title: 'Branded Academies',
      icon: LayoutTemplate,
      description: 'Your domain, your colours, your sign-in',
      href: '/#bx-academy',
      hash: '#bx-academy'
    },
    {
      key: 'analytics',
      title: 'Analytics',
      icon: ChartNoAxesCombined,
      description: 'Track progress, completion and engagement',
      href: '/#hs',
      hash: '#hs'
    },
    {
      key: 'integrations',
      title: 'Integrations',
      icon: PlugZap,
      description: 'Connect Zapier and the tools your team uses',
      href: '/#bx-integrations',
      hash: '#bx-integrations'
    },
    {
      key: 'plugins',
      title: 'Plugins',
      icon: Puzzle,
      description: 'Add custom widgets to your platform',
      href: '/#bx-plugins',
      hash: '#bx-plugins'
    }
  ];

  const useCaseItems: NavItem[] = [
    {
      key: 'customer-education',
      title: 'Customer Education',
      icon: GraduationCap,
      description: 'Help customers get more value from your product',
      href: '/customer-education'
    },
    {
      key: 'partner-training',
      title: 'Partner Training',
      icon: Handshake,
      description: 'Certify resellers and partners at scale',
      href: '/partner-training'
    },
    {
      key: 'cohort-training',
      title: 'Cohort Training',
      icon: UsersRound,
      description: 'Run customers through a course together',
      href: '/cohort-training'
    },
    {
      key: 'certification-programs',
      title: 'Certification Programs',
      icon: Award,
      description: 'Give customers and partners a certificate when they finish',
      href: '/certification-programs'
    }
  ];

  const industryItems: NavItem[] = [
    { key: 'software', title: 'Software', icon: AppWindow, href: '/solutions' },
    { key: 'manufacturing', title: 'Manufacturing', icon: Factory, href: '/solutions' },
    { key: 'public-sector', title: 'Public Sector', icon: Landmark, href: '/solutions' },
    { key: 'retail', title: 'Retail', icon: Store, href: '/solutions' },
    { key: 'it-and-tech-services', title: 'IT and Tech Services', icon: Server, href: '/solutions' },
    { key: 'financial-services', title: 'Financial Services', icon: Banknote, href: '/solutions' },
    { key: 'healthcare', title: 'Healthcare', icon: HeartPulse, href: '/solutions' },
    { key: 'education', title: 'Education', icon: BookOpen, href: '/solutions' }
  ];

  const resourceItems: NavItem[] = [
    {
      key: 'customer-stories',
      title: 'Customer stories',
      icon: Quote,
      description: 'See how teams use ClassroomIO',
      href: '/customers'
    },
    {
      key: 'blog',
      title: 'Blog',
      icon: FileText,
      description: 'Articles from the ClassroomIO team',
      href: '/blog'
    },
    {
      key: 'help-center',
      title: 'Help center',
      icon: CircleQuestionMark,
      description: 'Guides for setting up and using ClassroomIO',
      href: 'https://classroomio.com/help'
    },
    {
      key: 'changelog',
      title: 'Changelog',
      icon: History,
      description: 'What changed in each release',
      href: '/changelog'
    },
    {
      key: 'roadmap',
      title: 'Roadmap',
      icon: Map,
      description: 'What we are building next',
      href: 'https://feedback.classroomio.com/roadmap',
      external: true
    }
  ];

  const solutionsColumns: NavColumn[] = [
    { heading: 'By use case', items: useCaseItems },
    { heading: 'By industry', variant: 'chips', items: industryItems }
  ];

  const mobileRows: MobileRow[] = [
    { key: 'product', kind: 'accordion', label: 'Product', columns: [{ items: productItems }] },
    { key: 'pricing', kind: 'link', label: 'Pricing', href: '/pricing' },
    { key: 'about', kind: 'link', label: 'About', href: '/about' },
    { key: 'solutions', kind: 'accordion', label: 'Solutions', columns: solutionsColumns },
    { key: 'resources', kind: 'accordion', label: 'Resources', columns: [{ items: resourceItems }] }
  ];

  let scrolled = $state(false);
  let sheetOpen = $state(false);
  let openDropdown = $state<string | null>(null);
  let mobileAccordion = $state<string | null>(null);
  let burgerButton = $state<HTMLButtonElement | null>(null);
  let reduceMotion = $state(false);

  const isHomepage = $derived(page.url.pathname === '/');

  function linkHref(item: { href: string; hash?: string }) {
    if (isHomepage && item.hash) return item.hash;

    return item.href;
  }

  function isCurrent(href: string) {
    if (!href.startsWith('/') || href.includes('#')) return false;

    const pathname = page.url.pathname;
    if (pathname === href) return true;

    return href !== '/' && pathname.startsWith(`${href}/`);
  }

  function isSectionCurrent(items: NavItem[]) {
    return items.some((item) => isCurrent(item.href));
  }

  function getLenis() {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;

    return lenis ?? null;
  }

  function toggleDropdown(id: string, event: MouseEvent) {
    event.stopPropagation();
    openDropdown = openDropdown === id ? null : id;
  }

  function closeDropdowns() {
    openDropdown = null;
  }

  function toggleSheet() {
    sheetOpen = !sheetOpen;

    if (!sheetOpen) {
      mobileAccordion = null;
    }
  }

  function closeSheet() {
    sheetOpen = false;
    mobileAccordion = null;
  }

  function toggleMobileAccordion(id: string) {
    mobileAccordion = mobileAccordion === id ? null : id;
  }

  $effect(() => {
    if (!sheetOpen) return;

    const lenis = getLenis();
    lenis?.stop();

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
      lenis?.start();
    };
  });

  onMount(() => {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const syncReduceMotion = () => {
      reduceMotion = reduceMotionQuery.matches;
    };

    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        closeSheet();
      }
    };

    const handleScroll = () => {
      scrolled = window.scrollY > 8;
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.nav-dd')) {
        closeDropdowns();
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      closeDropdowns();

      if (sheetOpen) {
        closeSheet();
        burgerButton?.focus();
      }
    };

    syncReduceMotion();
    reduceMotionQuery.addEventListener('change', syncReduceMotion);
    desktopQuery.addEventListener('change', handleDesktopChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    handleScroll();

    return () => {
      reduceMotionQuery.removeEventListener('change', syncReduceMotion);
      desktopQuery.removeEventListener('change', handleDesktopChange);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#snippet desktopTrigger(id: string, label: string, items: NavItem[])}
  <button
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[14.5px] font-medium text-gray-700 transition-colors hover:bg-[var(--panel)]"
    class:bg-[var(--panel)]={openDropdown === id || isSectionCurrent(items)}
    type="button"
    aria-expanded={openDropdown === id}
    aria-controls={`${id}-menu`}
    onclick={(event) => toggleDropdown(id, event)}
  >
    {label}
    <svg
      class="transition-transform duration-200"
      class:rotate-180={openDropdown === id}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <path
        d="M2 3.5l3 3 3-3"
        stroke="currentColor"
        stroke-width="1.4"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
{/snippet}

{#snippet desktopRowItem(item: NavItem)}
  <a
    class="flex items-start gap-3.5 rounded-[10px] p-3 hover:bg-[var(--panel)]"
    class:bg-[var(--panel)]={isCurrent(item.href)}
    href={linkHref(item)}
    target={item.external ? '_blank' : undefined}
    rel={item.external ? 'noopener' : undefined}
    aria-current={isCurrent(item.href) ? 'page' : undefined}
    onclick={closeDropdowns}
  >
    <i
      class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-[#eef2fd] text-[15px] text-[var(--blue)] not-italic"
      ><item.icon size={15} aria-hidden="true" /></i
    >
    <span>
      <b class="block text-[14.5px] font-medium text-[var(--ink)]">{item.title}</b>
      {#if item.description}
        <em class="mt-0.5 block text-[13px] leading-snug text-[var(--muted)] not-italic">{item.description}</em>
      {/if}
    </span>
  </a>
{/snippet}

{#snippet desktopChipItem(item: NavItem)}
  <a
    class="flex items-center gap-3 rounded-[10px] px-1.5 py-2.5 hover:bg-white"
    class:bg-white={isCurrent(item.href)}
    href={linkHref(item)}
    aria-current={isCurrent(item.href) ? 'page' : undefined}
    onclick={closeDropdowns}
  >
    <i
      class="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#e8ecfb] text-[13px] text-[var(--blue)] not-italic"
      ><item.icon size={13} aria-hidden="true" /></i
    >
    <b class="text-[14.5px] font-medium text-[var(--ink)]">{item.title}</b>
  </a>
{/snippet}

{#snippet mobileItem(item: NavItem)}
  <a
    class="flex items-center gap-3.5 rounded-[10px] p-2.5 transition-colors hover:bg-[var(--panel)] active:bg-[var(--panel)]"
    class:bg-[var(--panel)]={isCurrent(item.href)}
    href={linkHref(item)}
    target={item.external ? '_blank' : undefined}
    rel={item.external ? 'noopener' : undefined}
    aria-current={isCurrent(item.href) ? 'page' : undefined}
    onclick={closeSheet}
  >
    <i
      class="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#eef3fe] text-[16px] text-[var(--blue)] not-italic"
      ><item.icon size={16} aria-hidden="true" /></i
    >
    <span>
      <b class="block text-[15.5px] font-medium text-[var(--ink)]">{item.title}</b>
      {#if item.description}
        <em class="mt-0.5 block text-[13.5px] leading-snug text-[var(--muted)] not-italic">{item.description}</em>
      {/if}
    </span>
  </a>
{/snippet}

{#snippet mobileChipItem(item: NavItem)}
  <a
    class="flex min-h-12 items-center gap-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1.5 transition-colors hover:border-[#cddcfc] hover:bg-[#eef3fe] active:border-[#cddcfc] active:bg-[#eef3fe]"
    class:border-[#cddcfc]={isCurrent(item.href)}
    class:bg-[#eef3fe]={isCurrent(item.href)}
    href={linkHref(item)}
    aria-current={isCurrent(item.href) ? 'page' : undefined}
    onclick={closeSheet}
  >
    <i
      class="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] bg-white text-[13px] text-[var(--blue)] not-italic"
      ><item.icon size={13} aria-hidden="true" /></i
    >
    <b class="text-[13.5px] leading-tight font-medium text-[var(--ink)]">{item.title}</b>
  </a>
{/snippet}

<header
  class="nav-header sticky top-0 z-50 border-b border-transparent bg-white/82 backdrop-blur-[14px] backdrop-saturate-[1.6] transition-[border-color,background-color] duration-300"
  class:border-b-[var(--line)]={scrolled}
  data-menu-open={sheetOpen}
  style="--line: #ebebed; --blue: #0542cc; --blue-h: #0233bd; --ink: #0e0f13; --muted: #6b6e76; --panel: #f5f5f4; --soft: #fafaf9; --line-2: #e2e2e5; --ease: cubic-bezier(0.22, 1, 0.36, 1);"
>
  <div class="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-5 sm:px-7">
    <a
      class="inline-flex shrink-0 items-center gap-2.5 text-[17px] font-semibold tracking-tight"
      href="/"
      aria-label="ClassroomIO home"
    >
      <img src="/home/images/logo.svg" width="26" height="19" alt="" />
      <span>ClassroomIO</span>
    </a>

    <nav class="hidden items-center gap-1 lg:flex" style="margin: 0 auto;" aria-label="Main">
      <div class="nav-dd relative">
        {@render desktopTrigger('product', 'Product', productItems)}
        {#if openDropdown === 'product'}
          <div
            id="product-menu"
            class="absolute top-[calc(100%+10px)] -left-3 z-[60] w-[340px] rounded-[10px] border border-[var(--line)] bg-white p-2 text-left shadow-lg"
          >
            {#each productItems as item (item.key)}
              {@render desktopRowItem(item)}
            {/each}
          </div>
        {/if}
      </div>

      <a
        class="rounded-full px-3 py-2 text-[14.5px] font-medium text-gray-700 transition-colors hover:bg-[var(--panel)]"
        class:bg-[var(--panel)]={isCurrent('/pricing')}
        href="/pricing"
        aria-current={isCurrent('/pricing') ? 'page' : undefined}>Pricing</a
      >
      <a
        class="rounded-full px-3 py-2 text-[14.5px] font-medium text-gray-700 transition-colors hover:bg-[var(--panel)]"
        class:bg-[var(--panel)]={isCurrent('/about')}
        href="/about"
        aria-current={isCurrent('/about') ? 'page' : undefined}>About</a
      >

      <div class="nav-dd relative">
        {@render desktopTrigger('solutions', 'Solutions', [...useCaseItems, ...industryItems])}
        {#if openDropdown === 'solutions'}
          <div
            id="solutions-menu"
            class="absolute top-[calc(100%+10px)] left-1/2 z-[60] w-[680px] -translate-x-[40%] rounded-[10px] border border-[var(--line)] bg-white p-3.5 text-left shadow-lg"
          >
            <div class="grid grid-cols-[1fr_1.05fr] gap-3.5">
              <div>
                <p class="m-0 px-3 py-1.5 pb-2 text-xs font-medium tracking-widest text-[var(--muted)] uppercase">
                  {solutionsColumns[0].heading}
                </p>
                {#each useCaseItems as item (item.key)}
                  {@render desktopRowItem(item)}
                {/each}
              </div>
              <div class="rounded-[10px] bg-[var(--panel)] p-2">
                <p class="m-0 px-1.5 py-1.5 pb-2 text-xs font-medium tracking-widest text-[var(--muted)] uppercase">
                  {solutionsColumns[1].heading}
                </p>
                <div class="grid grid-cols-2 gap-0.5">
                  {#each industryItems as item (item.key)}
                    {@render desktopChipItem(item)}
                  {/each}
                </div>
              </div>
            </div>
            <div
              class="mt-3 flex items-center justify-between rounded-[10px] bg-[var(--panel)] px-4 py-3.5 text-sm text-[var(--muted)]"
            >
              <span>Not sure where to start?</span>
              <a class="font-medium text-[var(--blue)]" href="https://cal.com/classroomio/demo" onclick={closeDropdowns}
                >Talk to our team →</a
              >
            </div>
          </div>
        {/if}
      </div>

      <div class="nav-dd relative">
        {@render desktopTrigger('resources', 'Resources', resourceItems)}
        {#if openDropdown === 'resources'}
          <div
            id="resources-menu"
            class="absolute top-[calc(100%+10px)] right-[-12px] z-[60] w-[340px] rounded-[10px] border border-[var(--line)] bg-white p-2 text-left shadow-lg"
          >
            {#each resourceItems as item (item.key)}
              {@render desktopRowItem(item)}
            {/each}
          </div>
        {/if}
      </div>
    </nav>

    <div class="hidden items-center gap-2 lg:flex" style="margin-left: auto;">
      <a
        class="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--line-2)] bg-white px-[18px] text-[14.5px] font-medium transition-colors hover:bg-[var(--soft)] active:scale-[0.97]"
        href="https://app.classroomio.com/login">Log in</a
      >
      <a
        class="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--blue)] px-[18px] text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--blue-h)] active:scale-[0.97]"
        href="https://app.classroomio.com/signup">Start for free</a
      >
    </div>

    <button
      class="nav-burger relative ml-auto h-10 w-10 shrink-0 rounded-[10px] lg:hidden"
      bind:this={burgerButton}
      type="button"
      aria-label={sheetOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={sheetOpen}
      aria-controls="mobile-menu"
      onclick={toggleSheet}
    >
      <span class="nav-burger-bar top-[16.25px]"></span>
      <span class="nav-burger-bar top-[22.25px]"></span>
    </button>
  </div>

  {#if sheetOpen}
    <div
      id="mobile-menu"
      class="absolute inset-x-0 top-full flex h-[calc(100dvh-64px)] flex-col border-t border-[var(--line)] bg-white lg:hidden"
      role="region"
      aria-label="Menu"
      transition:fly={{ y: -8, duration: reduceMotion ? 0 : 260, easing: cubicOut }}
    >
      <div class="flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-6" data-lenis-prevent>
        {#each mobileRows as row, index (row.key)}
          <div class="nav-sheet-row border-b border-[var(--line)]" style="--i: {index}">
            {#if row.kind === 'accordion'}
              <button
                class="flex min-h-[60px] w-full items-center justify-between gap-3 px-1 text-left"
                type="button"
                aria-expanded={mobileAccordion === row.key}
                aria-controls={`mobile-panel-${row.key}`}
                onclick={() => toggleMobileAccordion(row.key)}
              >
                <span class="text-[19px] leading-tight font-medium tracking-[-0.02em] text-[var(--ink)]">
                  {row.label}
                </span>
                <i class="nav-sheet-chev" data-open={mobileAccordion === row.key}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
                </i>
              </button>

              <div class="nav-sheet-panel" id={`mobile-panel-${row.key}`} data-open={mobileAccordion === row.key}>
                <div inert={mobileAccordion !== row.key}>
                  <div class="pb-3.5">
                    {#each row.columns as column, columnIndex (column.heading ?? columnIndex)}
                      {#if column.heading}
                        <p
                          class="mx-1 mt-2.5 mb-1.5 px-2 text-[12px] font-medium tracking-[0.08em] text-[var(--muted)] uppercase"
                        >
                          {column.heading}
                        </p>
                      {/if}

                      {#if column.variant === 'chips'}
                        <div class="mt-3 grid grid-cols-2 gap-1.5">
                          {#each column.items as item (item.key)}
                            {@render mobileChipItem(item)}
                          {/each}
                        </div>
                      {:else}
                        <div class="grid gap-0.5">
                          {#each column.items as item (item.key)}
                            {@render mobileItem(item)}
                          {/each}
                        </div>
                      {/if}
                    {/each}
                  </div>
                </div>
              </div>
            {:else}
              <a
                class="nav-sheet-link flex min-h-[60px] items-center justify-between gap-3 px-1"
                class:rounded-[10px]={isCurrent(row.href)}
                class:bg-[var(--panel)]={isCurrent(row.href)}
                href={linkHref(row)}
                data-current={isCurrent(row.href)}
                aria-current={isCurrent(row.href) ? 'page' : undefined}
                onclick={closeSheet}
              >
                <span>{row.label}</span>
                <i class="nav-sheet-go">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                </i>
              </a>
            {/if}
          </div>
        {/each}
      </div>

      <div
        class="shrink-0 border-t border-[var(--line)] bg-white px-4 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]"
      >
        <div class="grid grid-cols-2 gap-2">
          <Button
            href="https://app.classroomio.com/login"
            variant="outline"
            size="lg"
            class="w-full text-[15px]"
            onclick={closeSheet}
          >
            Log in
          </Button>
          <Button
            href="https://app.classroomio.com/signup"
            variant="default"
            size="lg"
            class="w-full text-[15px]"
            onclick={closeSheet}
          >
            Start for free
          </Button>
        </div>
        <a
          class="mt-3 block text-center text-sm text-[var(--muted)]"
          href="https://cal.com/classroomio/demo"
          onclick={closeSheet}
        >
          Not sure where to start?
          <b class="font-medium text-[var(--blue)]">Book a demo</b>
        </a>
      </div>
    </div>
  {/if}
</header>

<style>
  .nav-header[data-menu-open='true'] {
    background-color: #fff;
    border-bottom-color: var(--line);
  }

  .nav-burger {
    background: var(--panel);
    border: 0;
    transition: background 0.2s;
  }

  .nav-burger[aria-expanded='true'] {
    background: #cddcfc;
  }

  .nav-burger-bar {
    position: absolute;
    left: 13px;
    right: 13px;
    height: 1.5px;
    background: var(--ink);
    transition: transform 0.35s var(--ease);
  }

  .nav-burger[aria-expanded='true'] .nav-burger-bar:first-child {
    transform: translateY(3px) rotate(45deg);
  }

  .nav-burger[aria-expanded='true'] .nav-burger-bar:last-child {
    transform: translateY(-3px) rotate(-45deg);
  }

  .nav-sheet-row {
    animation: nav-sheet-row-in 0.5s var(--ease) backwards;
    animation-delay: calc(var(--i, 0) * 35ms + 60ms);
  }

  @keyframes nav-sheet-row-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  .nav-sheet-chev,
  .nav-sheet-go {
    display: grid;
    width: 32px;
    height: 32px;
    flex: none;
    place-items: center;
    border-radius: 10px;
    background: var(--panel);
    color: var(--ink);
    transition:
      background 0.2s,
      color 0.2s;
  }

  .nav-sheet-chev svg,
  .nav-sheet-go svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.35s var(--ease);
  }

  .nav-sheet-chev[data-open='true'] {
    background: var(--blue);
    color: #fff;
  }

  .nav-sheet-chev[data-open='true'] svg {
    transform: rotate(180deg);
  }

  .nav-sheet-panel {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.4s var(--ease);
  }

  .nav-sheet-panel[data-open='true'] {
    grid-template-rows: 1fr;
  }

  .nav-sheet-panel > * {
    min-height: 0;
    overflow: hidden;
  }

  .nav-sheet-link {
    font-family: inherit;
    font-size: 19px;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--ink);
  }

  .nav-sheet-link[data-current='true'] {
    margin-top: 4px;
    margin-bottom: 4px;
    padding-left: 16px;
    padding-right: 16px;
    color: var(--blue);
  }

  .nav-sheet-link[data-current='true'] span::after {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-left: 10px;
    border-radius: 999px;
    background: currentColor;
    vertical-align: middle;
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-sheet-row {
      animation: none;
    }

    .nav-sheet-panel,
    .nav-sheet-chev svg,
    .nav-burger-bar {
      transition: none;
    }
  }
</style>
