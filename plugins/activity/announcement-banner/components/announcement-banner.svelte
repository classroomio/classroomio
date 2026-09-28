<script lang="ts">
  import { browser } from '$app/environment';
  import { Megaphone, X, ArrowRight, Sparkles } from '@lucide/svelte';
  import { isCourseLearnerView, isOrgStudent, isStudentExperience } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { coursesApi } from '$features/course/api';
  import { announcementSettingsStore } from '$features/plugins/store/plugin-settings';
  import { onDestroy } from 'svelte';

  interface BannerConfig {
    id?: string;
    message?: string;
    variant?: 'info' | 'warning' | 'success';
    linkText?: string;
    linkUrl?: string;
    dismissible?: boolean;
    backgroundColor?: string;
  }

  interface Props {
    config?: BannerConfig;
    [key: string]: any;
  }

  let { config = {} }: Props = $props();

  const isLearner = $derived(Boolean($isCourseLearnerView || $isOrgStudent || $isStudentExperience));

  let latestCourse = $state<{ id: string; title: string } | null>(null);
  let bannerHeight = $state(44);

  // Sync settings for the current organization
  $effect(() => {
    if (browser && $currentOrg?.id) {
      announcementSettingsStore.init($currentOrg.id, $currentOrg?.customization?.announcement);
    }
  });

  // Fetch recently published courses to announce to learners
  $effect(() => {
    if (!browser || !isLearner || !$currentOrg.id) return;

    coursesApi
      .getOrgCoursesPage({ limit: 5 })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          const published = res.data.filter((c: any) => c.isPublished !== false);
          if (published.length > 0) {
            latestCourse = published[0];
          }
        }
      })
      .catch(() => {});
  });

  const bannerBgColor = $derived(config.backgroundColor || $announcementSettingsStore.backgroundColor || '#2563EB');

  const bannerId = $derived(config.id ?? (latestCourse ? `new_course_${latestCourse.id}` : 'default-broadcast-v1'));
  const message = $derived.by(() => {
    if (config.message) return config.message;
    if ($announcementSettingsStore.mode === 'custom' && $announcementSettingsStore.customMessage) {
      return $announcementSettingsStore.customMessage;
    }
    return latestCourse
      ? `New Course Published: "${latestCourse.title}" is now open for enrollment!`
      : 'Welcome! Explore newly released courses and interactive training tracks in your academy.';
  });

  const linkText = $derived(
    config.linkText ||
      ($announcementSettingsStore.mode === 'custom' && $announcementSettingsStore.customLinkText
        ? $announcementSettingsStore.customLinkText
        : 'Explore Courses')
  );

  const linkUrl = $derived(
    config.linkUrl ||
      ($announcementSettingsStore.mode === 'custom' && $announcementSettingsStore.customLinkUrl
        ? $announcementSettingsStore.customLinkUrl
        : latestCourse
          ? `/courses/${latestCourse.id}`
          : '/lms/explore')
  );

  const dismissible = $derived(config.dismissible ?? true);

  let dismissed = $state(false);

  $effect(() => {
    if (!browser) return;
    const stored = localStorage.getItem(`cio_dismissed_announcement_${bannerId}`);
    dismissed = stored === 'true';
  });

  // Keep sidebar docked right under the top fixed banner without clipping
  $effect(() => {
    if (!browser) return;
    if (isLearner && !dismissed) {
      document.documentElement.style.setProperty('--sidebar-top-offset', `${bannerHeight}px`);
    } else {
      document.documentElement.style.setProperty('--sidebar-top-offset', '0px');
    }
  });

  onDestroy(() => {
    if (browser) {
      document.documentElement.style.setProperty('--sidebar-top-offset', '0px');
    }
  });

  function handleDismiss() {
    dismissed = true;
    if (browser) {
      localStorage.setItem(`cio_dismissed_announcement_${bannerId}`, 'true');
      document.documentElement.style.setProperty('--sidebar-top-offset', '0px');
    }
  }
</script>

{#if isLearner && !dismissed}
  <!-- Fixed Announcement Banner with Centered Content -->
  <aside
    bind:clientHeight={bannerHeight}
    class="fixed top-0 right-0 left-0 z-50 w-full border-b border-black/10 px-4 py-2.5 text-white shadow-md transition-all duration-300"
    style="background-color: {bannerBgColor};"
    aria-label="Student Announcement"
    data-testid="lms-announcement-banner"
  >
    <div class="relative mx-auto flex max-w-7xl items-center justify-center px-10 text-sm">
      <!-- Centered Banner Details -->
      <div class="flex items-center justify-center gap-3 truncate overflow-hidden text-center">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
          <Sparkles class="h-3.5 w-3.5 fill-current" />
        </span>
        <div class="flex items-center gap-2 truncate">
          <span
            class="text-2xs shrink-0 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 font-bold tracking-wide text-white uppercase backdrop-blur-xs"
          >
            New
          </span>
          <p class="truncate font-medium text-white drop-shadow-xs">
            {message}
          </p>
        </div>

        {#if linkUrl}
          <a
            href={linkUrl}
            class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-xs transition-colors hover:bg-white/90"
          >
            <span>{linkText}</span>
            <ArrowRight class="h-3.5 w-3.5 text-slate-700" />
          </a>
        {/if}
      </div>

      <!-- Right-docked Dismiss Button -->
      {#if dismissible}
        <button
          type="button"
          onclick={handleDismiss}
          class="absolute top-1/2 right-0 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white transition-opacity hover:bg-white/20"
          aria-label="Dismiss banner"
        >
          <X class="h-4 w-4 stroke-[2.5]" />
        </button>
      {/if}
    </div>
  </aside>
{/if}
