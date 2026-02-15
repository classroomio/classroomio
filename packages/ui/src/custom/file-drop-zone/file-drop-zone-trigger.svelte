<script lang="ts">
  import { cn } from '../../tools';
  import { useFileDropZoneTrigger } from './file-drop-zone-util.svelte';
  import { displaySize } from './index';
  import type { FileDropZoneTriggerProps } from './types';
  import { HoverableItem, UploadIcon } from '../moving-icons';

  let {
    ref = $bindable(null),
    class: className,
    children,
    label = "Drag 'n' drop files here, or click to select files",
    formatMaxFiles = (count: number) => `You can upload ${count} files`,
    formatMaxFilesAndSize = (size: string) => `(up to ${size} each)`,
    formatMaxSize = (size: string) => `Maximum size ${size}`,
    ...rest
  }: FileDropZoneTriggerProps = $props();

  const triggerState = useFileDropZoneTrigger();
</script>

<label bind:this={ref} class={cn('ui:group/file-drop-zone-trigger', className)} {...triggerState.props} {...rest}>
  {#if children}
    {@render children()}
  {:else}
    <HoverableItem
      class="ui:hover:bg-accent/25 ui:flex ui:h-48 ui:flex-col ui:place-items-center ui:justify-center ui:gap-2 ui:rounded-lg ui:border ui:border-dashed ui:p-6 ui:transition-all group-aria-disabled/file-drop-zone-trigger:ui:opacity-50 ui:hover:cursor-pointer group-aria-disabled/file-drop-zone-trigger:ui:hover:cursor-not-allowed"
    >
      {#snippet children(isHovered)}
        <div class="ui:flex ui:flex-col ui:place-items-center ui:justify-center ui:gap-2">
          <div
            class="ui:border-border ui:text-muted-foreground ui:flex ui:size-14 ui:place-items-center ui:justify-center ui:rounded-full ui:border ui:border-dashed"
          >
            <UploadIcon {isHovered} size={28} class="ui:size-7" />
          </div>
          <div class="ui:flex ui:flex-col ui:gap-0.5 ui:text-center">
            <span class="ui:text-muted-foreground">
              {label}
            </span>
            {#if triggerState.rootState.opts.maxFiles.current || triggerState.rootState.opts.maxFileSize.current}
              <span class="ui:text-muted-foreground/75 ui:text-sm">
                {#if triggerState.rootState.opts.maxFiles.current}
                  <span>
                    {formatMaxFiles(triggerState.rootState.opts.maxFiles.current)}
                  </span>
                {/if}
                {#if triggerState.rootState.opts.maxFiles.current && triggerState.rootState.opts.maxFileSize.current}
                  <span>
                    {formatMaxFilesAndSize(displaySize(triggerState.rootState.opts.maxFileSize.current))}
                  </span>
                {/if}
                {#if triggerState.rootState.opts.maxFileSize.current && !triggerState.rootState.opts.maxFiles.current}
                  <span>
                    {formatMaxSize(displaySize(triggerState.rootState.opts.maxFileSize.current))}
                  </span>
                {/if}
              </span>
            {/if}
          </div>
        </div>
      {/snippet}
    </HoverableItem>
  {/if}
</label>
