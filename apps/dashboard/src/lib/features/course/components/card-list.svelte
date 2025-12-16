<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import Card, { type Props as CardProps } from './card.svelte';

  type Props = Omit<CardProps, 'course'> & {
    courses: CardProps['course'][];
  };

  let { courses, ...rest }: Props = $props();
</script>

<Item.Group class="grid! w-full grid-cols-1 gap-4 lg:grid-cols-3">
  {#each courses as course (course.id)}
    <Card {course} {...rest} />
  {/each}
</Item.Group>
