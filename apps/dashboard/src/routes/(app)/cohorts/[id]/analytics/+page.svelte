<script lang="ts">
  import { CohortInsightsPage } from '$features/insights';

  let { data } = $props();
</script>

<CohortInsightsPage cohortId={data.cohortId} />
