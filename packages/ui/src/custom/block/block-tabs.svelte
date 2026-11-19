<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TextAlignCenterIcon from '@lucide/svelte/icons/text-align-center';
  import TextAlignEndIcon from '@lucide/svelte/icons/text-align-end';
  import TextAlignStartIcon from '@lucide/svelte/icons/text-align-start';
  import XIcon from '@lucide/svelte/icons/x';
  import { tick, type Snippet } from 'svelte';
  import * as Tabs from '../../base/tabs';
  import * as ToggleGroup from '../../base/toggle-group';
  import { cn } from '../../tools';
  import InlineText from './block-inline-text.svelte';
  import type { TabsBlockAlignment, TabsBlockLabels, TabsBlockTab } from './types';

  interface Props {
    tabs: TabsBlockTab[];
    align: TabsBlockAlignment;
    editable?: boolean;
    maxTabs?: number;
    nameMaxLength?: number;
    noteMaxLength?: number;
    labels: TabsBlockLabels;
    testId?: string;
    content: Snippet<[string]>;
    onNameInput?: (tabId: string, name: string) => void;
    onNoteInput?: (tabId: string, note: string) => void;
    onAddTab?: () => void;
    onRemoveTab?: (tabId: string) => void;
    onAlignChange?: (align: TabsBlockAlignment) => void;
  }

  let {
    tabs,
    align,
    editable = false,
    maxTabs = 10,
    nameMaxLength,
    noteMaxLength,
    labels,
    testId,
    content,
    onNameInput,
    onNoteInput,
    onAddTab,
    onRemoveTab,
    onAlignChange
  }: Props = $props();

  const ALIGNMENTS: TabsBlockAlignment[] = ['left', 'center', 'right'];
  const ALIGNMENT_ICONS: Record<TabsBlockAlignment, typeof TextAlignStartIcon> = {
    left: TextAlignStartIcon,
    center: TextAlignCenterIcon,
    right: TextAlignEndIcon
  };

  let requestedTabId = $state('');
  let nameRef = $state<HTMLElement | null>();

  const activeTab = $derived(tabs.find((tab) => tab.id === requestedTabId) ?? tabs[0]);
  const canAddTab = $derived(tabs.length < maxTabs);
  const canRemoveTab = $derived(tabs.length > 1);

  function isAlignment(value: string): value is TabsBlockAlignment {
    return ALIGNMENTS.some((alignment) => alignment === value);
  }

  function selectNameText(element: HTMLElement) {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function addTab() {
    const knownIds = new Set(tabs.map((tab) => tab.id));
    onAddTab?.();
    await tick();

    const added = tabs.find((tab) => !knownIds.has(tab.id));
    if (!added) return;

    requestedTabId = added.id;
    await tick();
    if (!nameRef) return;

    nameRef.focus();
    selectNameText(nameRef);
  }

  /** Removes a tab and opens the first tab that is left. */
  function removeTab(tabId: string) {
    if (!canRemoveTab) return;

    requestedTabId = tabs.find((tab) => tab.id !== tabId)?.id ?? '';
    onRemoveTab?.(tabId);
  }

  const triggerClass =
    'ui:text-muted-foreground ui:hover:text-foreground ui:data-[state=active]:bg-primary ui:data-[state=active]:text-primary-foreground ui:dark:data-[state=active]:bg-primary ui:dark:data-[state=active]:text-primary-foreground ui:dark:data-[state=active]:border-transparent ui:h-auto ui:max-w-[260px] ui:flex-none ui:rounded-full ui:border-0 ui:py-[9px] ui:text-[13.5px] ui:font-semibold ui:data-[state=active]:shadow-none ui:max-[560px]:py-2 ui:max-[560px]:text-[13px]';
</script>

<div
  class={cn(
    'ui:flex ui:flex-col ui:gap-5',
    align === 'left' && 'ui:text-left',
    align === 'center' && 'ui:text-center',
    align === 'right' && 'ui:text-right'
  )}
  data-testid={testId}
  data-align={align}
>
  {#if editable}
    <div
      class={cn(
        'ui:text-muted-foreground ui:flex ui:flex-wrap ui:items-center ui:gap-2 ui:text-[11.5px] ui:max-[560px]:justify-center',
        align === 'center' && 'ui:justify-center',
        align === 'right' && 'ui:justify-end'
      )}
    >
      <span>{labels.position}</span>
      <ToggleGroup.Root
        type="single"
        value={align}
        spacing={0}
        aria-label={labels.position}
        class="ui:border-border ui:bg-card ui:gap-0.5 ui:rounded-full ui:border ui:p-0.5 ui:shadow-2xs"
        onValueChange={(value) => isAlignment(value) && onAlignChange?.(value)}
      >
        {#each ALIGNMENTS as alignment (alignment)}
          <ToggleGroup.Item
            value={alignment}
            aria-label={labels.alignments[alignment]}
            title={labels.alignments[alignment]}
            data-testid={testId ? `${testId}-align-${alignment}` : undefined}
            class="ui:text-muted-foreground ui:hover:text-foreground ui:data-[state=on]:bg-primary ui:data-[state=on]:text-primary-foreground ui:h-6 ui:min-w-[26px] ui:rounded-full ui:px-0 ui:hover:bg-transparent"
          >
            {@const AlignmentIcon = ALIGNMENT_ICONS[alignment]}
            <AlignmentIcon class="ui:size-3.5" aria-hidden="true" />
          </ToggleGroup.Item>
        {/each}
      </ToggleGroup.Root>
    </div>
  {/if}

  {#if activeTab}
    <Tabs.Root value={activeTab.id} onValueChange={(value) => (requestedTabId = value)} class="ui:gap-0">
      <div
        class={cn(
          'ui:border-border ui:bg-card ui:flex ui:max-w-full ui:items-center ui:overflow-x-auto ui:rounded-full ui:border ui:p-1 ui:shadow-xs ui:[scrollbar-width:none] ui:max-[560px]:self-stretch',
          align === 'left' && 'ui:self-start',
          align === 'center' && 'ui:self-center',
          align === 'right' && 'ui:self-end'
        )}
      >
        <Tabs.List
          aria-label={labels.tabList}
          class="ui:h-auto ui:w-auto ui:shrink-0 ui:justify-start ui:gap-0 ui:rounded-none ui:bg-transparent ui:p-0"
        >
          {#each tabs as tab (tab.id)}
            {@const isActive = tab.id === activeTab.id}
            {#if editable}
              <Tabs.Trigger
                value={tab.id}
                class={cn(triggerClass, 'ui:gap-0 ui:pr-0 ui:pl-5')}
                data-testid={testId ? `${testId}-tab-${tab.id}` : undefined}
              >
                {#snippet child({ props })}
                  <div {...props}>
                    {#if isActive}
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <span class="ui:min-w-[56px] ui:truncate" onkeydown={(event) => event.stopPropagation()}>
                        <InlineText
                          value={tab.name}
                          editable
                          placeholder={labels.untitledTab}
                          ariaLabel={labels.tabName}
                          maxLength={nameMaxLength}
                          class="ui:text-primary-foreground ui:empty:before:text-primary-foreground/70 ui:block ui:px-1 ui:whitespace-nowrap"
                          testId={testId ? `${testId}-name` : undefined}
                          bind:ref={nameRef}
                          onInput={(name) => onNameInput?.(tab.id, name)}
                        />
                      </span>
                    {:else}
                      <span class="ui:truncate ui:px-1">{tab.name || labels.untitledTab}</span>
                    {/if}
                    {#if isActive && canRemoveTab}
                      <button
                        type="button"
                        class="ui:text-primary-foreground/85 ui:hover:text-primary-foreground ui:mr-2 ui:ml-1 ui:grid ui:size-6 ui:shrink-0 ui:place-items-center ui:rounded-full ui:transition-colors ui:hover:bg-white/20"
                        aria-label={labels.removeTab}
                        title={labels.removeTab}
                        data-testid={testId ? `${testId}-remove` : undefined}
                        onpointerdown={(event) => event.stopPropagation()}
                        onclick={(event) => {
                          event.stopPropagation();
                          removeTab(tab.id);
                        }}
                      >
                        <XIcon size={12} strokeWidth={2.4} class="custom" />
                      </button>
                    {:else}
                      <span class="ui:mr-2 ui:ml-1 ui:size-6 ui:shrink-0" aria-hidden="true"></span>
                    {/if}
                  </div>
                {/snippet}
              </Tabs.Trigger>
            {:else}
              <Tabs.Trigger
                value={tab.id}
                class={cn(triggerClass, 'ui:px-5 ui:max-[560px]:px-3.5')}
                data-testid={testId ? `${testId}-tab-${tab.id}` : undefined}
              >
                <span class="ui:truncate">{tab.name || labels.untitledTab}</span>
              </Tabs.Trigger>
            {/if}
          {/each}
        </Tabs.List>

        {#if editable && canAddTab}
          <button
            type="button"
            class="ui:text-muted-foreground ui:hover:text-primary ui:hover:bg-muted/70 ui:ml-2 ui:inline-flex ui:h-9 ui:shrink-0 ui:items-center ui:gap-1.5 ui:rounded-full ui:px-3 ui:text-[13px] ui:font-medium ui:whitespace-nowrap ui:transition-colors ui:max-[560px]:w-9 ui:max-[560px]:justify-center ui:max-[560px]:px-0"
            aria-label={labels.addTab}
            data-testid={testId ? `${testId}-add` : undefined}
            onclick={addTab}
          >
            <PlusIcon size={14} strokeWidth={2.4} />
            <span class="ui:max-[560px]:hidden">{labels.addTab}</span>
          </button>
        {/if}
      </div>

      <Tabs.Content value={activeTab.id} class="ui:flex ui:flex-col">
        {#key activeTab.id}
          {#if editable || activeTab.note}
            <div class="ui:pt-[18px] ui:pb-1.5">
              <InlineText
                tag="p"
                value={activeTab.note}
                {editable}
                multiline
                placeholder={labels.notePlaceholder}
                maxLength={noteMaxLength}
                class={cn(
                  'ui:m-0 ui:max-w-[520px] ui:text-[15px] ui:leading-[1.65]',
                  align === 'center' && 'ui:mx-auto',
                  align === 'right' && 'ui:ml-auto',
                  editable &&
                    'ui:hover:bg-card/70 ui:focus-visible:bg-card ui:focus-visible:ring-primary/40 ui:-mx-3 ui:min-h-[1.65em] ui:rounded-md ui:px-3 ui:py-2',
                  editable && align === 'center' && 'ui:mx-auto',
                  editable && align === 'right' && 'ui:mr-[-12px] ui:ml-auto'
                )}
                testId={testId ? `${testId}-note` : undefined}
                onInput={(note) => onNoteInput?.(activeTab.id, note)}
              />
            </div>
          {/if}
          <div class="ui:pt-2 ui:text-left">
            {@render content(activeTab.id)}
          </div>
        {/key}
      </Tabs.Content>
    </Tabs.Root>
  {/if}
</div>
