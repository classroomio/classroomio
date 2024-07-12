<script>
  import HomeIcon from '../Icons/HomeIcon.svelte';
  import SiteSettingsIcon from '../Icons/SiteSettingsIcon.svelte';
  import QuizIcon from '../Icons/QuizIcon.svelte';
  import AudienceIcon from '../Icons/AudienceIcon.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import { SettingsAdjust } from 'carbon-icons-svelte';
  import CourseIcon from '../Icons/CourseIcon.svelte';

  export let name = '';
</script>

{#if name === 'Dashboard'}
  <HomeIcon />
{:else if name === 'Courses'}
  <CourseIcon />
{:else if name === 'Site'}
  <SiteSettingsIcon />
{:else if name === 'Community'}
  <ForumIcon size={20} class="carbon-icon fill-[#000] dark:fill-[#fff]" />
{:else if name === 'Quiz'}
  <QuizIcon />
{:else if name === 'Audience'}
  <AudienceIcon />
{:else if name === 'Setup'}
  <SettingsAdjust />
{/if}
