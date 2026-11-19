<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { Badge } from '@cio/ui/base/badge';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { shortenName } from '$lib/utils/functions/string';

  interface Props {
    name: string;
    avatarUrl?: string | null;
    roleLabel: string;
    subtitle?: string;
    ariaLabel: string;
    leavesDashboard?: boolean;
    busy?: boolean;
    disabled?: boolean;
    testId?: string;
    onSelect: () => void;
  }

  let {
    name,
    avatarUrl,
    roleLabel,
    subtitle,
    ariaLabel,
    leavesDashboard = false,
    busy = false,
    disabled = false,
    testId,
    onSelect
  }: Props = $props();

  function handleSelect() {
    if (disabled) return;

    onSelect();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    handleSelect();
  }
</script>

<ResourceListRow.Root variant="default" size="sm" class="px-4! py-3!">
  {#snippet child({ props })}
    <div
      {...props}
      role="button"
      tabindex={disabled ? -1 : 0}
      class="{props.class as string} w-full cursor-pointer text-left aria-disabled:cursor-wait aria-disabled:opacity-70"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      data-testid={testId}
      onclick={handleSelect}
      onkeydown={handleKeydown}
    >
      <ResourceListRow.Lead>
        <Avatar.Root class="size-10 rounded-lg">
          <Avatar.Image src={avatarUrl} alt={name} />
          <Avatar.Fallback class="rounded-lg">{shortenName(name)}</Avatar.Fallback>
        </Avatar.Root>
      </ResourceListRow.Lead>

      <ResourceListRow.Main>
        <span class="flex min-w-0 items-center gap-2">
          <span class="truncate text-sm font-medium">{name}</span>
          <Badge variant="secondary" class="shrink-0">{roleLabel}</Badge>
        </span>
        {#if subtitle}
          <span class="ui:text-muted-foreground truncate text-xs">{subtitle}</span>
        {/if}
      </ResourceListRow.Main>

      <ResourceListRow.End>
        {#if busy}
          <LoaderCircleIcon class="ui:text-muted-foreground size-4 animate-spin" />
        {:else if leavesDashboard}
          <ArrowUpRightIcon class="ui:text-muted-foreground size-4" aria-hidden="true" />
        {:else}
          <ArrowRightIcon class="ui:text-muted-foreground size-4" aria-hidden="true" />
        {/if}
      </ResourceListRow.End>
    </div>
  {/snippet}
</ResourceListRow.Root>
