<script lang="ts">
  import AudienceIcon from '$lib/components/Icons/AudienceIcon.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import HomeIcon from '$lib/components/Icons/HomeIcon.svelte';
  import QuizIcon from '$lib/components/Icons/QuizIcon.svelte';
  import SiteSettingsIcon from '$lib/components/Icons/SiteSettingsIcon.svelte';
  import { Forum, SettingsAdjust } from 'carbon-icons-svelte';

  export let iconId: string;

  const ICON_CLASS = {
    dashboard: 'dashboard',
    courses: 'courses',
    community: 'community',
    site: 'site',
    quiz: 'quiz',
    audience: 'audience',
    setup: 'setup'
  };
</script>

{#if ICON_CLASS.dashboard === iconId}
  <HomeIcon />
{:else if ICON_CLASS.courses === iconId}
  <CourseIcon />
{:else if ICON_CLASS.site === iconId}
  <SiteSettingsIcon />
{:else if ICON_CLASS.community === iconId}
  <Forum class="carbon-icon fill-[#000] dark:fill-[#fff]" />
{:else if ICON_CLASS.quiz === iconId}
  <QuizIcon />
{:else if ICON_CLASS.audience === iconId}
  <AudienceIcon />
{:else if ICON_CLASS.setup === iconId}
  <SettingsAdjust />
{/if}
