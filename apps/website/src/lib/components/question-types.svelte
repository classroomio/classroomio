<script>
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';
</script>

<Section class="bg-gray-50">
  <SectionHeader
    eyebrow="Assessments & Exams"
    eyebrowClass="text-blue-700"
    ledeClass="text-gray-500"
    lede="Most LMS platforms give you multiple choice and call it a day. ClassroomIO supports the full range so your exams actually test what matters."
  >
    {#snippet title()}Exams that go beyond multiple choice.{/snippet}
  </SectionHeader>

  <div class="mt-14 flex justify-center">
    <div data-cio-widget="question-type-picker" class="w-full max-w-[900px]"></div>
  </div>
</Section>

<svelte:head>
  <script type="module" src="https://embed.classroomio.com/question-type-picker"></script>
</svelte:head>
