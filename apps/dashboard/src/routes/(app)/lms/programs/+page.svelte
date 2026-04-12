<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { programApi } from '$features/program/api';
  import { profile } from '$lib/utils/store/user';
  import { ProgramsPage } from '$features/program/pages';

  let searchValue = $state('');

  $effect(() => {
    if ($profile.id) {
      programApi.listEnrolledPrograms();
    }
  });

  const programs = $derived(programApi.programs);
  const filteredPrograms = $derived.by(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return programs.filter((program) => {
      if (!normalizedSearch) {
        return true;
      }

      return [program.name, program.description].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  });
</script>

<svelte:head>
  <title>{$t('lms_navigation.programs') || 'Programs'} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('lms_navigation.programs') || 'Programs'}</Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <ProgramsPage
        programs={filteredPrograms}
        isLMS={true}
        isLoading={programApi.isLoading && programs.length === 0}
        bind:searchValue
        emptyTitle={$t('programs.lms.empty_title') || 'No programs yet'}
        emptyDescription={$t('programs.lms.empty_description')}
      />
    {/snippet}
  </Page.Body>
</Page.Root>
