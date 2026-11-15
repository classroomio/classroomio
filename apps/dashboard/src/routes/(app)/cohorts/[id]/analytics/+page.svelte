<script lang="ts">
  import { CohortAnalyticsPage } from '$features/analytics';

  let { data } = $props();
</script>

<CohortAnalyticsPage cohortId={data.cohortId} />
