<script lang="ts">
  import { CommunityQuestionPage } from '$features/community/pages';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  let { data } = $props();

  const communityPath = $derived(page.url.pathname.replace(/\/[^/]+$/, ''));
</script>

<svelte:head>
  <title>Question - ClassroomIO</title>
</svelte:head>

<CommunityQuestionPage slug={data.slug} backHref={resolve(communityPath, {})} />
