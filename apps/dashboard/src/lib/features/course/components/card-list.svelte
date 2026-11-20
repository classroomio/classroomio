<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import Card, { type Props as CardProps } from './card.svelte';

  type Props = Omit<CardProps, 'course' | 'onExploreClick'> & {
    courses: CardProps['course'][];
    onCardClick?: (course: CardProps['course']) => void;
  };

  let { courses, onCardClick, ...rest }: Props = $props();
</script>

<Item.Group class="grid! w-full grid-cols-1 justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
  {#each courses as course (course.id)}
    <div class="flex w-full justify-center" data-testid="course-card">
      <Card {course} {...rest} onExploreClick={onCardClick ? () => onCardClick(course) : undefined} />
    </div>
  {/each}
</Item.Group>
