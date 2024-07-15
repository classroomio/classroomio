<script>
  import HomeIcon from '../Icons/HomeIcon.svelte';
  import SiteSettingsIcon from '../Icons/SiteSettingsIcon.svelte';
  import QuizIcon from '../Icons/QuizIcon.svelte';
  import AudienceIcon from '../Icons/AudienceIcon.svelte';
  import ForumIcon from 'carbon-icons-svelte/lib/Forum.svelte';
  import { SettingsAdjust } from 'carbon-icons-svelte';
  import CourseIcon from '../Icons/CourseIcon.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let name = '';
</script>

{#if name === $t('org_navigation.dashboard')}
  <HomeIcon />
{:else if name === $t('org_navigation.courses')}
  <CourseIcon />
{:else if name === 'Site'}
  <SiteSettingsIcon />
{:else if name === $t('org_navigation.community')}
  <ForumIcon size={20} class="carbon-icon fill-[#000] dark:fill-[#fff]" />
{:else if name === 'Quiz'}
  <QuizIcon />
{:else if name === $t('org_navigation.audience')}
  <AudienceIcon />
{:else if name === $t('org_navigation.setup')}
  <SettingsAdjust />
{/if}
