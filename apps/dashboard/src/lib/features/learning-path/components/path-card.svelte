<script lang="ts">
  import { CourseCard } from '@cio/ui';
  import { Image } from '$features/ui';
  import pluralize from 'pluralize';
  import CoursePublishBadge from '$features/course/components/course-publish-badge.svelte';
  import PathCardDropdown from './path-card-dropdown.svelte';
  import type { LearningPathSummary } from '../utils/types';
  import { PathIcon } from '@cio/ui/custom/moving-icons';

  interface Props {
    path: LearningPathSummary;
    basePath?: string;
    onDelete?: (id: string, name: string) => void;
  }

  let { path, onDelete }: Props = $props();

  const isDraftSetup = $derived(path.status === 'DRAFT' && (path.memberCount || 0) === 0);
  const targetHref = $derived(isDraftSetup ? `/paths/${path.id}/setup` : `/paths/${path.id}/courses`);
  const isPublished = $derived(path.status === 'ACTIVE' || (path.status as string) === 'PUBLISHED');
  const bannerImage = $derived(path.coverImage || '/images/classroomio-course-img-template.jpg');
  const courseCount = $derived(path.courseCount || 0);
  const memberCount = $derived(path.memberCount || 0);

  const typeBadge = $derived({
    label: 'Learning Path',
    icon: PathIcon,
    iconClass: 'custom ui:text-primary mr-1.5 [&_svg]:w-3 [&_svg]:h-3'
  });
</script>

<div class="group/stack ui:sm:mx-0 ui:sm:max-w-[320px] relative mx-auto w-full">
  <!-- Stacked Card Underlayer (Card Stack Effect from Design) -->
  <div
    class="ui:border-border ui:bg-card pointer-events-none absolute inset-0 -translate-x-1.5 translate-y-1.5 rounded-lg border transition-transform duration-200 group-hover/stack:-translate-x-2 group-hover/stack:translate-y-2"
    aria-hidden="true"
  ></div>

  <CourseCard
    href={targetHref}
    title={path.name}
    description={path.description || ''}
    {typeBadge}
    class="ui:bg-card group relative w-full"
  >
    {#snippet media()}
      <Image src={bannerImage} alt="Learning path banner image" className="w-full h-full rounded-sm object-cover" />
    {/snippet}

    {#snippet overlay()}
      <PathCardDropdown id={path.id} slug={path.slug} name={path.name} {isPublished} {onDelete} />
    {/snippet}

    {#snippet footer()}
      <div class="flex w-full items-center justify-between">
        <div class="py-2 text-xs">
          <CoursePublishBadge {isPublished} />
        </div>

        <div class="flex flex-col justify-end gap-1 text-right">
          <p class="pl-2 text-xs whitespace-nowrap dark:text-white">
            {pluralize('course', courseCount, true)}
          </p>
          <p class="ui:text-muted-foreground pl-2 text-xs">
            {memberCount > 0 ? pluralize('learner', memberCount, true) : 'No learners yet'}
          </p>
        </div>
      </div>
    {/snippet}
  </CourseCard>
</div>
