<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { Alert, AlertDescription, AlertTitle } from '@cio/ui/base/alert';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import CircleXIcon from '@lucide/svelte/icons/circle-x';
  import { onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';

  import { courseBuildApi } from '../api/course-build.svelte';
  import {
    buildHeadingKey,
    courseBuildCardBodyKey,
    isCourseBuildActive,
    readyCourseIds,
    showsCourseBuildCard,
    sourceLabel
  } from '../utils/course-build-utils';
  import CourseBuildProgress from './course-build-progress.svelte';

  let loadedOrgId = '';
  let poll: AbortController | null = null;
  let knownReady: Set<string> | null = null;

  const build = $derived(courseBuildApi.latest);
  const site = $derived(build?.sources[0] ? sourceLabel(build.sources[0]) : '');
  const visible = $derived(showsCourseBuildCard(build));
  const bodyKey = $derived(build ? courseBuildCardBodyKey(build) : null);
  const waiting = $derived(Boolean(build && isCourseBuildActive(build)));
  const broken = $derived(build?.status === 'FAILED' || build?.status === 'CANCELED');

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || organizationId === loadedOrgId) return;

    loadedOrgId = organizationId;
    knownReady = null;
    poll?.abort();
    poll = new AbortController();
    void courseBuildApi.pollLatest(poll.signal);
  });

  $effect(() => {
    if (!build) return;

    const ready = readyCourseIds(build);
    const previous = knownReady;
    knownReady = ready;
    if (previous && [...ready].some((id) => !previous.has(id))) void invalidateAll();
  });

  onDestroy(() => poll?.abort());
</script>

{#if build && visible && bodyKey}
  {#if waiting}
    <Card.Root class="mb-4 w-full shadow-none" data-testid="course-build-card">
      <Card.Header>
        <Card.Title>{$t(buildHeadingKey(build))}</Card.Title>
        <Card.Description>{$t('course_build.card_body', { site })}</Card.Description>
      </Card.Header>
      <Card.Content>
        <CourseBuildProgress {build} links />
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="mb-4 flex flex-col gap-4" data-testid="course-build-card">
      <Alert variant={broken ? 'destructive' : 'warning'}>
        {#if broken}
          <CircleXIcon aria-hidden="true" />
        {:else}
          <CircleAlertIcon aria-hidden="true" />
        {/if}
        <AlertTitle>{$t(buildHeadingKey(build))}</AlertTitle>
        <AlertDescription>{$t(bodyKey)}</AlertDescription>
      </Alert>

      {#if build.sources.length}
        <CourseBuildProgress {build} links />
      {/if}
    </div>
  {/if}
{/if}
