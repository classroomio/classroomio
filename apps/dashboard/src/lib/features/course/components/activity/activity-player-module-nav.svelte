<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { t } from '$lib/utils/functions/translations';
  import { formatTimeLimit } from '$features/course/utils/scorm-utils';
  import type { LaunchActivityModule } from '$features/course/utils/types';

  interface Props {
    units: LaunchActivityModule[];
    currentIdentifier: string | null;
    onSelect: (identifier: string) => void;
    onPrevious: () => void;
    onNext: () => void;
    overlay?: boolean;
    overlayVisible?: boolean;
    portalTarget?: HTMLElement | null;
    showExit?: boolean;
    onExit?: () => void;
    menuOpen?: boolean;
  }

  let {
    units,
    currentIdentifier,
    onSelect,
    onPrevious,
    onNext,
    overlay = false,
    overlayVisible = true,
    portalTarget = null,
    showExit = false,
    onExit,
    menuOpen = $bindable(false)
  }: Props = $props();

  const currentIndex = $derived(units.findIndex((unit) => unit.identifier === currentIdentifier));
  const completedCount = $derived(units.filter((unit) => unit.completed).length);
  const prevUnit = $derived(currentIndex > 0 ? units[currentIndex - 1] : null);
  const nextUnit = $derived(currentIndex >= 0 && currentIndex < units.length - 1 ? units[currentIndex + 1] : null);
  const isPrevLocked = $derived(Boolean(prevUnit?.locked));
  const isNextLocked = $derived(Boolean(nextUnit?.locked));
  const hasPrevious = $derived(currentIndex > 0);
  const hasNext = $derived(currentIndex >= 0 && currentIndex < units.length - 1);
  const isPrevDisabled = $derived(!hasPrevious || isPrevLocked);
  const isNextDisabled = $derived(!hasNext || isNextLocked);
  const timeLimit = $derived(formatTimeLimit(units[currentIndex]?.maxTimeAllowed));
  const contentProps = $derived(portalTarget ? { portalProps: { to: portalTarget } } : {});

  function select(identifier: string) {
    menuOpen = false;
    onSelect(identifier);
  }

  $effect(() => {
    if (!menuOpen) return;

    function handleWindowBlur() {
      menuOpen = false;
    }

    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  });
</script>

<div
  class={overlay
    ? `ui:bg-background/85 ui:border-border absolute inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-opacity duration-300 ${overlayVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`
    : 'ui:border-border relative z-50 border-b'}
>
  <div class="flex items-center gap-2 px-3 py-2">
    <Button
      size="sm"
      variant="secondary"
      onclick={onPrevious}
      disabled={isPrevDisabled}
      aria-label={$t('course.navItem.lessons.activities.player.prev_module')}
    >
      <ChevronLeftIcon size={14} />
    </Button>
    <div class="min-w-0 flex-1">
      <Popover.Root bind:open={menuOpen}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              size="sm"
              variant={overlay ? 'secondary' : 'outline'}
              class="w-full justify-center"
              aria-label={$t('course.navItem.lessons.activities.player.module_menu')}
            >
              <span class="truncate">
                {$t('course.navItem.lessons.activities.player.module_position', {
                  current: currentIndex + 1,
                  total: units.length
                })}
                ·
                {units[currentIndex]?.title ?? ''}
              </span>
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content {...contentProps} side="bottom" align="center" class="max-h-80 overflow-y-auto p-1.5">
          <p class="ui:text-muted-foreground px-2 py-1.5 text-xs">
            {$t('course.navItem.lessons.activities.player.modules_complete', {
              complete: completedCount,
              total: units.length
            })}
          </p>
          <div role="group" aria-label={$t('course.navItem.lessons.activities.player.module_menu')}>
            {#each units as unit, index (unit.identifier)}
              <Button
                size="sm"
                variant={unit.identifier === currentIdentifier ? 'secondary' : 'ghost'}
                class="w-full justify-start"
                aria-current={unit.identifier === currentIdentifier || undefined}
                disabled={unit.locked && unit.identifier !== currentIdentifier}
                title={unit.locked ? $t('course.navItem.lessons.activities.player.module_locked') : undefined}
                onclick={() => select(unit.identifier)}
              >
                {#if unit.completed}
                  <CircleCheckIcon size={14} filled />
                {:else if unit.locked}
                  <LockIcon size={14} class="ui:text-muted-foreground shrink-0" />
                {:else}
                  <span class="ui:text-muted-foreground w-3.5 shrink-0 text-center text-xs tabular-nums">
                    {index + 1}
                  </span>
                {/if}
                <span class="min-w-0 flex-1 truncate text-left">{unit.title}</span>
              </Button>
            {/each}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <span {...props} class="inline-flex {isNextLocked ? 'cursor-not-allowed' : ''}">
              <Button
                size="sm"
                variant="secondary"
                onclick={onNext}
                disabled={isNextDisabled}
                title={isNextLocked ? $t('course.navItem.lessons.activities.player.module_locked') : undefined}
                aria-label={$t('course.navItem.lessons.activities.player.next_module')}
              >
                <ChevronRightIcon size={14} />
              </Button>
            </span>
          {/snippet}
        </Tooltip.Trigger>
        {#if isNextLocked}
          <Tooltip.Content side="bottom" sideOffset={4}>
            {$t('course.navItem.lessons.activities.player.module_locked')}
          </Tooltip.Content>
        {/if}
      </Tooltip.Root>
    </Tooltip.Provider>
    {#if timeLimit}
      <Badge variant="outline" title={$t('course.navItem.lessons.activities.player.time_limit', { time: timeLimit })}>
        <ClockIcon size={12} />
        {timeLimit}
      </Badge>
    {/if}
    {#if showExit}
      <Button
        size="sm"
        variant="secondary"
        onclick={() => onExit?.()}
        aria-label={$t('course.navItem.lessons.activities.player.exit_fullscreen')}
      >
        <MinimizeIcon size={14} />
      </Button>
    {/if}
  </div>
</div>
