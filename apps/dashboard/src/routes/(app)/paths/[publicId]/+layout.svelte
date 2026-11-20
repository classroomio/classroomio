<script lang="ts">
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { NotPermittedModal } from '$features/ui';
  import { Spinner } from '@cio/ui/base/spinner';
  import { learningPathApi } from '$features/learning-path/api';
  import { pathJourneyApi } from '$features/lms/api';
  import { resolvePathAccessState, resolvePathViewMode } from '$features/learning-path/utils/path-view-mode';
  import { setPathViewContext } from '$features/learning-path/utils/path-view-context';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { isOrgStudent, isPathLearnerView, isStudentExperience } from '$lib/utils/store/app';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    children?: Snippet;
    data: {
      publicId: string;
    };
  }

  let { data, children }: Props = $props();

  const mode = $derived(resolvePathViewMode($isPathLearnerView, $isOrgStudent, $isStudentExperience));

  setPathViewContext(() => mode);

  let fetchKey: string | null = $state(null);

  $effect(() => {
    if (!data.publicId || !$profile.id || mode === 'loading') return;

    const key = `${mode}:${data.publicId}`;
    if (fetchKey === key) return;

    fetchKey = key;

    if (mode === 'staff') {
      void learningPathApi.ensurePath(data.publicId);
      return;
    }

    void pathJourneyApi.fetchJourney(data.publicId);
  });

  const staffIsLoaded = $derived(
    learningPathApi.currentPath?.publicId === data.publicId || learningPathApi.currentPath?.id === data.publicId
  );
  const learnerIsLoaded = $derived(pathJourneyApi.journey?.path.publicId === data.publicId);

  const accessState = $derived(
    mode === 'staff'
      ? resolvePathAccessState({
          isLoaded: staffIsLoaded,
          isNotFound: learningPathApi.isNotFound,
          isForbidden: learningPathApi.isForbidden,
          loadError: learningPathApi.loadError
        })
      : mode === 'learner'
        ? resolvePathAccessState({
            isLoaded: learnerIsLoaded,
            isNotFound: pathJourneyApi.isNotFound,
            isForbidden: pathJourneyApi.isForbidden,
            loadError: pathJourneyApi.loadError
          })
        : ('loading' as const)
  );

  const pageTitle = $derived(
    mode === 'staff'
      ? (learningPathApi.currentPath?.name ?? null)
      : mode === 'learner'
        ? (pathJourneyApi.journey?.path.name ?? null)
        : null
  );

  const forbiddenHref = $derived(mode === 'learner' ? '/lms/mylearning' : `${$currentOrgPath}/paths`);

  function handleForbiddenGo() {
    void goto(forbiddenHref);
  }

  function handleRetry() {
    if (mode === 'staff') {
      void learningPathApi.refreshPath(data.publicId);
      return;
    }

    if (mode === 'learner') {
      void pathJourneyApi.fetchJourney(data.publicId);
    }
  }
</script>

<svelte:head>
  <title>{pageTitle || $t('org_navigation.learning_paths')} - ClassroomIO</title>
</svelte:head>

{#if mode === 'loading' || accessState === 'loading'}
  <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center p-6">
    <Empty
      title={$t('learningPath.workspace.loading_title')}
      description={$t('learningPath.workspace.loading_description')}
      icon={Spinner}
      iconClass="h-8 w-8"
      variant="page"
    />
  </div>
{:else if accessState === 'not_found'}
  <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center p-6">
    <Empty
      title={$t('learningPath.workspace.not_found_title')}
      description={$t('learningPath.workspace.not_found_description')}
      variant="page"
    >
      <div class="mt-4 flex justify-center">
        <Button href={forbiddenHref} variant="outline">
          {#if mode === 'learner'}
            {$t('common.back_to_my_learning')}
          {:else}
            {$t('learningPath.workspace.back_to_paths')}
          {/if}
        </Button>
      </div>
    </Empty>
  </div>
{:else if accessState === 'forbidden'}
  <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center p-6">
    <Empty
      title={$t('learningPath.not_permitted.header')}
      description={$t('learningPath.not_permitted.body')}
      variant="page"
    >
      <div class="mt-4 flex justify-center">
        <Button onclick={handleForbiddenGo} variant="outline">
          {mode === 'learner' ? $t('common.back_to_my_learning') : $t('learningPath.not_permitted.button')}
        </Button>
      </div>
    </Empty>
  </div>

  <NotPermittedModal
    open={true}
    entityType="learning_path"
    buttonText={mode === 'learner' ? $t('common.back_to_my_learning') : $t('learningPath.not_permitted.button')}
    onAction={handleForbiddenGo}
  />
{:else if accessState === 'error'}
  <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center p-6">
    <Empty
      title={$t('learningPath.workspace.load_failed_title')}
      description={$t('learningPath.workspace.load_failed_description')}
      variant="page"
    >
      <div class="mt-4 flex justify-center gap-2">
        <Button variant="outline" onclick={handleRetry}>
          {$t('common.refresh')}
        </Button>
        <Button href={forbiddenHref} variant="outline">
          {#if mode === 'learner'}
            {$t('common.back_to_my_learning')}
          {:else}
            {$t('learningPath.workspace.back_to_paths')}
          {/if}
        </Button>
      </div>
    </Empty>
  </div>
{:else}
  {@render children?.()}
{/if}
