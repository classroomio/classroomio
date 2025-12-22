<script>
  import { CommunityQuestionPage } from '$features/community/pages';

  let { data } = $props();
</script>

<svelte:head>
  <title>Question - ClassroomIO</title>
</svelte:head>

<CommunityQuestionPage slug={data.slug} isLMS={true} />
