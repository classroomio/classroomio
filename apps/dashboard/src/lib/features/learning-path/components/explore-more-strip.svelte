<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { GitBranch } from '@lucide/svelte';

  interface ExplorePath {
    id: string;
    name: string;
    description: string;
    coverGradient?: string;
    href: string;
  }

  interface Props {
    items: ExplorePath[];
  }

  let { items }: Props = $props();
</script>

<section class="my-9">
  <div class="mb-1 flex items-center justify-between gap-3">
    <h2 class="text-base font-semibold">{$t('learningPath.explore.title')}</h2>
    <a
      class="ui:text-muted-foreground hover:ui:text-primary inline-flex items-center gap-1 text-sm hover:underline"
      href="/lms/explore"
    >
      {$t('learningPath.explore.view_more')}
      <ArrowRightIcon class="size-3.5" />
    </a>
  </div>
  <p class="ui:text-muted-foreground -mt-1 mb-4 text-sm">{$t('learningPath.explore.tagline')}</p>

  <div class="grid grid-cols-3 gap-4 md:grid-cols-3">
    {#each items as path}
      <a
        href={path.href}
        class="group hover:ui:border-ring flex flex-col overflow-hidden rounded-xl border transition-colors"
      >
        <div
          class="relative flex h-24 items-center justify-center overflow-hidden"
          style="background: {path.coverGradient ??
            'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))'}"
        >
          <GitBranch size={20} class="absolute top-3 right-3" color="white" />
          <LearningPathBadge type="path" onCover class="absolute top-3 left-3" />
        </div>
        <div class="flex flex-1 flex-col p-4">
          <h3 class="line-clamp-1 text-sm font-semibold">{path.name}</h3>
          <p class="ui:text-muted-foreground mt-1.5 line-clamp-2 text-xs">{path.description}</p>
          <div class="mt-4">
            <Button href={path.href} variant="outline" size="sm" class="w-full">
              {$t('learningPath.explore.view_path')}
              <ArrowRightIcon size={17} />
            </Button>
          </div>
        </div>
      </a>
    {/each}
  </div>
</section>
