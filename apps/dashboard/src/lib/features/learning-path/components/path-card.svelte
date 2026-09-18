<script lang="ts">
  import { CourseCard } from '@cio/ui';
  import { Image } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import CoursePublishBadge from '$features/course/components/course-publish-badge.svelte';
  import PathCardDropdown from './path-card-dropdown.svelte';
  import type { LearningPathSummary } from '../utils/types';
  import { PathIcon } from '@cio/ui/custom/moving-icons';

  interface Props {
    path: LearningPathSummary;
    onDelete?: (id: string, name: string) => void;
  }

  let { path, onDelete }: Props = $props();

  const isDraftSetup = $derived(!path.isPublished && (path.memberCount || 0) === 0);
  const targetHref = $derived(isDraftSetup ? `/paths/${path.publicId}/setup` : `/paths/${path.publicId}`);
  const isPublished = $derived(path.isPublished ?? false);
  const bannerImage = $derived(path.coverImage || '/images/classroomio-course-img-template.jpg');
  const courseCount = $derived(path.courseCount || 0);
  const memberCount = $derived(path.memberCount || 0);

  const typeBadge = $derived({
    label: $t('learningPath.card.badge'),
    icon: PathIcon,
    iconClass: 'custom ui:text-primary [&_svg]:w-3 [&_svg]:h-3'
  });
</script>

<div class="group/stack relative mx-auto w-full sm:mx-0 sm:max-w-[320px]">
  <!-- Stacked Card Underlayer (Card Stack Effect from Design) -->
  <div
    class="ui:border-border ui:bg-card pointer-events-none absolute inset-0 -translate-x-1.5 translate-y-1.5 rounded-lg border transition-transform duration-200 group-hover/stack:-translate-x-2 group-hover/stack:translate-y-2"
    aria-hidden="true"
  ></div>

  <CourseCard href={targetHref} title={path.name} description={path.description} {typeBadge} class="group relative">
    {#snippet media()}
      <Image src={bannerImage} alt={path.name} className="w-full h-full rounded-sm object-cover" />
    {/snippet}

    {#snippet overlay()}
      <PathCardDropdown
        id={path.id}
        publicId={path.publicId}
        slug={path.slug}
        name={path.name}
        description={path.description}
        {isPublished}
        {onDelete}
      />
    {/snippet}

    {#snippet footer()}
      <div class="flex w-full items-center justify-between">
        <div class="py-2 text-xs">
          <CoursePublishBadge {isPublished} />
        </div>

        <div class="flex flex-col justify-end gap-1 text-right">
          <p class="pl-2 text-xs whitespace-nowrap dark:text-white">
            {$t('learningPath.listing.card.courses_count', { count: courseCount })}
          </p>
          <p class="ui:text-muted-foreground pl-2 text-xs">
            {memberCount > 0
              ? $t('learningPath.listing.card.learners_count', { count: memberCount })
              : $t('learningPath.listing.filters.no_learners')}
          </p>
        </div>
      </div>
    {/snippet}
  </CourseCard>
</div>
