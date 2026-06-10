<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import Card, { type Props as CardProps } from './card.svelte';

  type Props = Omit<CardProps, 'course' | 'onExploreClick'> & {
    courses: CardProps['course'][];
    onCardClick?: (course: CardProps['course']) => void;
  };

  let { courses, onCardClick, ...rest }: Props = $props();
</script>

<Item.Group class="grid! w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
  {#each courses as course (course.id)}
    <Card {course} {...rest} onExploreClick={onCardClick ? () => onCardClick(course) : undefined} />
  {/each}
</Item.Group>
