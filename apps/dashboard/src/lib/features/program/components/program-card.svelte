<script lang="ts">
  import pluralize from 'pluralize';
  import * as Item from '@cio/ui/base/item';
  import { Separator } from '@cio/ui/base/separator';
  import { t } from '$lib/utils/functions/translations';
  import type { Program } from '../utils/types';

  interface Props {
    program: Program;
    onclick?: () => void;
  }

  let { program, onclick }: Props = $props();

  const courseCount = $derived(program.courseCount ?? 0);
  const studentCount = $derived(program.studentCount ?? 0);
</script>

<Item.Root variant="outline" class="group relative max-w-[320px] cursor-pointer p-4!" {onclick}>
  {#snippet child({ props })}
    <div class="flex h-full flex-col justify-between gap-5" {...props}>
      <Item.Content>
        <Item.Title class="line-clamp-2 min-h-14 text-base!">
          {program.name}
        </Item.Title>

        <Separator class="my-3" />

        <div class="flex w-full justify-between">
          <div class="w-[60%]">
            <p class="pl-2 text-xs dark:text-white">
              {pluralize($t('programs.card.courses'), courseCount, true)}
            </p>
          </div>

          <div class="flex flex-col justify-between">
            <p class="pl-2 text-xs dark:text-white">
              {pluralize($t('programs.card.students'), studentCount, true)}
            </p>
          </div>
        </div>
      </Item.Content>
    </div>
  {/snippet}
</Item.Root>
