<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathListItem } from '../utils/types';
  import { formatDate, LEARNING_PATH_STATUS_KEYS } from '../utils/learning-path-utils';

  interface Props {
    path?: LearningPathListItem;
    loading?: boolean;
  }

  let { path, loading = false }: Props = $props();

  const needsSetup = $derived(path ? path.status === 'DRAFT' && path.learnerCount === 0 : false);
</script>

{#if loading || !path}
  <Card.Root class="overflow-hidden p-0">
    <Skeleton class="h-36 w-full rounded-none" />
    <div class="flex flex-col gap-3 p-4">
      <Skeleton class="h-5 w-2/3" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-2 w-full" />
    </div>
  </Card.Root>
{:else}
  <Card.Root class="flex flex-col overflow-hidden p-0" data-testid="learning-path-card">
    {#if path.coverImage}
      <img src={path.coverImage} alt="" class="h-36 w-full object-cover" loading="lazy" />
    {:else}
      <div class="ui:bg-muted ui:text-muted-foreground flex h-36 w-full items-center justify-center">
        <PathIcon size={28} />
      </div>
    {/if}

    <div class="flex flex-1 flex-col gap-3 p-4">
      <div class="flex flex-col gap-1">
        <h3 class="line-clamp-1 text-base font-semibold">{path.name}</h3>
        {#if path.description}
          <p class="ui:text-muted-foreground line-clamp-2 text-sm">{path.description}</p>
        {/if}
      </div>

      <p class="ui:text-muted-foreground text-sm">
        {$t(LEARNING_PATH_STATUS_KEYS[path.status])}
        · {$t('learning_paths.card.courses', { count: path.courseCount })}
        · {$t('learning_paths.card.learners', { count: path.learnerCount })}
      </p>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-sm">
          <span>{$t('learning_paths.card.completion')}</span>
          <span class="ui:text-muted-foreground">{path.completionRate}%</span>
        </div>
        <Progress value={path.completionRate} />
      </div>

      <div class="mt-auto flex items-center justify-between gap-2 pt-1">
        <span class="ui:text-muted-foreground text-xs">
          {$t('learning_paths.card.updated', { date: formatDate(path.updatedAt) })}
        </span>
        <Button size="sm" variant="secondary" href={resolve(`/paths/${path.id}/courses`, {})}>
          {needsSetup ? $t('learning_paths.card.continue_setup') : $t('learning_paths.card.manage')}
        </Button>
      </div>
    </div>
  </Card.Root>
{/if}
