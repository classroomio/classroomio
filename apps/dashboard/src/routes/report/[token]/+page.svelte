<script lang="ts">
  import { StudentReportView } from '$features/student-report/components';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.report.studentName} · {data.report.organization.name}</title>
  <meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="min-h-screen bg-neutral-100 py-6 print:bg-white print:py-0">
  <StudentReportView report={data.report} />
</div>
