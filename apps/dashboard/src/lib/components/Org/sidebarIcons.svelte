<script>
  import HomeIcon from '../Icons/HomeIcon.svelte';
  import SiteSettingsIcon from '../Icons/SiteSettingsIcon.svelte';
  import QuizIcon from '../Icons/QuizIcon.svelte';
  import AudienceIcon from '../Icons/AudienceIcon.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import { SettingsAdjust } from 'carbon-icons-svelte';
  import CourseIcon from '../Icons/CourseIcon.svelte';

  export let iconId;

  let ICON_CLASS = {
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
  <ForumIcon size={20} class="carbon-icon fill-[#000] dark:fill-[#fff]" />
{:else if ICON_CLASS.quiz === iconId}
  <QuizIcon />
{:else if ICON_CLASS.audience === iconId}
  <AudienceIcon />
{:else if ICON_CLASS.setup === iconId}
  <SettingsAdjust />
{/if}
