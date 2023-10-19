<script lang="ts">
  import { fetchSubmission } from '$lib/utils/services/submissions';
  import type { ExerciseSubmissions } from '$lib/utils/types';

  export let exerciseId: string;

  let isLoading = false;
  let analyticsData: ExerciseSubmissions[] = [];

  async function fetchAnalyticsData(id: string | undefined) {
    console.log('id', id);
    if (!id) return;

    const { data } = await fetchSubmission({
      exerciseId: id
    });

    if (!data) return;

    // This is the data you need, look at the typescript interface
    analyticsData = data;
  }

  $: fetchAnalyticsData(exerciseId);
</script>

{#if isLoading}
  Loading data
{:else}
  Analytics data
{/if}
