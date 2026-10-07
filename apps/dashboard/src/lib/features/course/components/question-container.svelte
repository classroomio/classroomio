<script lang="ts">
  import { NumberField } from '@cio/ui/custom/number-field';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { t } from '$lib/utils/functions/translations';
  import type { Snippet } from 'svelte';

  interface Props {
    isTitle?: boolean;
    onClose?: () => void;
    points?: number | string;
    hasError?: boolean;
    errorMsg?: string | null;
    /** Hint shown next to the points input while points is 0 (e.g. auto-grade requires non-zero points) */
    pointsHint?: string | null;
    onPointsChange?: (value?: unknown) => void;
    elementId?: string;
    class?: string;
    key?: string;
    children?: Snippet;
  }

  let {
    isTitle = false,
    onClose = () => {},
    points = $bindable(undefined),
    hasError = false,
    errorMsg = null,
    pointsHint = null,
    onPointsChange = () => {},
    elementId,
    class: className = '',
    children
  }: Props = $props();

  // `points` is often bound to a plain store object property, which is not deeply
  // reactive — a local reactive owner keeps the zero-points warning live while typing.
  let pointsValue = $state(points);
  let pointsFocused = $state(false);
</script>

<div
  id={elementId}
  class="{hasError
    ? 'ui:border-destructive ui:dark:border-destructive'
    : 'ui:border-border'} root relative rounded-md border bg-white dark:bg-black {className}"
>
  {#if isTitle}
    <div class="title bg-primary-700 absolute"></div>
  {/if}
  <div class="px-4 {isTitle ? 'pt-4' : 'pt-2'} pb-3">
    {@render children?.()}
  </div>

  {#if typeof points !== 'undefined'}
    <div class="border-gray flex items-center justify-between border-t-2 border-r-0 border-b-0 border-l-0 p-2">
      <div class="flex w-40 items-center">
        <p class="mr-2 text-sm dark:text-white">
          {$t('course.navItem.lessons.exercises.new_exercise_modal.points')}:
        </p>
        <NumberField
          placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
          integer
          min={1}
          value={typeof pointsValue === 'number' ? pointsValue : null}
          onValueChange={(next) => {
            if (next === null) return;

            pointsValue = next;
            points = next;
            onPointsChange();
          }}
          onFocus={() => (pointsFocused = true)}
          onBlur={() => (pointsFocused = false)}
        />

        {#if !pointsFocused && Number(pointsValue) === 0}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger class="ml-2 shrink-0">
                <TriangleAlertIcon size={16} class="text-amber-500 dark:text-amber-400" />
              </Tooltip.Trigger>
              <Tooltip.Content side="top" sideOffset={4}>
                {$t('course.navItem.lessons.exercises.all_exercises.zero_points_warning')}
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        {/if}
      </div>

      {#if errorMsg}
        <p class="text-xs text-red-500">{errorMsg}</p>
      {:else if pointsHint && !pointsFocused && Number(pointsValue) === 0}
        <p class="ui:text-muted-foreground max-w-[min(100%,12rem)] text-xs">{pointsHint}</p>
      {/if}

      {#if onClose && !isTitle}
        <IconButton onclick={onClose}>
          <TrashIcon size={16} />
        </IconButton>
      {/if}
    </div>
  {/if}
</div>

<style>
  .title {
    color: rgba(255, 255, 255, 1);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    height: 10px;
    left: -1px;
    top: -1px;
    width: calc(100% + 2px);
  }
</style>
