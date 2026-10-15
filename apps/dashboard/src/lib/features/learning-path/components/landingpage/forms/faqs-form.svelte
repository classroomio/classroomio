<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage, TLandingPageFaq } from '@cio/utils/validation/learning-path';
  import { AddSectionButton } from '$features/ui';
  import { createFaqId } from '../../../utils/landing-page-utils';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  let faqs = $state<TLandingPageFaq[]>([...(landingPage.faqs ?? [])]);
  let showFaqs = $state(landingPage.showFaqs ?? true);
  let expandedIndex = $state<number | null>(null);

  $effect(() => {
    const next = landingPage.faqs ?? [];
    if (JSON.stringify(next) !== JSON.stringify(faqs)) {
      faqs = [...next];
      expandedIndex = null;
    }
  });

  $effect(() => {
    const next = landingPage.showFaqs ?? true;
    if (next !== showFaqs) showFaqs = next;
  });

  function handleToggleDisplay(checked: boolean) {
    showFaqs = checked;
    onChange({ showFaqs: checked });
  }

  function handleAdd() {
    const newItem: TLandingPageFaq = {
      id: createFaqId(),
      question: '',
      answer: ''
    };
    const next = [...faqs, newItem];
    faqs = next;
    expandedIndex = next.length - 1;
    onChange({ faqs: next });
  }

  function handleRemove(index: number) {
    const next = faqs.filter((_, i) => i !== index);
    faqs = next;
    if (expandedIndex === index) {
      expandedIndex = null;
    } else if (expandedIndex !== null && expandedIndex > index) {
      expandedIndex--;
    }
    onChange({ faqs: next });
  }

  function handleUpdateItem(index: number, patch: Partial<TLandingPageFaq>) {
    const next = [...faqs];
    next[index] = { ...next[index], ...patch };
    faqs = next;
    onChange({ faqs: next });
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between pb-2">
    <div class="space-y-0.5">
      <Label for="show-faqs-toggle" class="text-sm font-medium">
        {$t('learningPath.landing.display_section')}
      </Label>
      <p class="ui:text-muted-foreground text-xs">
        {showFaqs ? $t('settings.landing_page.show_section') : $t('settings.landing_page.hide_section')}
      </p>
    </div>
    <Switch id="show-faqs-toggle" checked={showFaqs} onCheckedChange={handleToggleDisplay} />
  </div>

  <div class="space-y-3">
    {#each faqs as item, index (item.id)}
      {@const isExpanded = expandedIndex === index}
      <div class="ui:border-border rounded-lg border p-3">
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            class="flex flex-1 cursor-pointer items-center justify-between text-left text-sm font-medium"
            onclick={() => (expandedIndex = isExpanded ? null : index)}
          >
            <span class="truncate">
              {item.question || $t('learningPath.landing.faqs.untitled')}
            </span>
            {#if isExpanded}
              <ChevronUpIcon class="ui:text-muted-foreground size-4 shrink-0" />
            {:else}
              <ChevronDownIcon class="ui:text-muted-foreground size-4 shrink-0" />
            {/if}
          </button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            class="ui:text-muted-foreground ui:hover:text-destructive size-7 shrink-0"
            onclick={() => handleRemove(index)}
            aria-label={$t('common.remove')}
          >
            <Trash2Icon class="size-3.5" />
          </Button>
        </div>

        {#if isExpanded}
          <div class="mt-3 space-y-3 border-t pt-3">
            <div>
              <Label class="ui:text-muted-foreground text-xs">{$t('learningPath.landing.faqs.question')}</Label>
              <Input
                value={item.question}
                placeholder={$t('learningPath.landing.faqs.question_placeholder')}
                class="mt-1 h-8 text-xs"
                oninput={(e) => handleUpdateItem(index, { question: (e.currentTarget as HTMLInputElement).value })}
              />
            </div>
            <div>
              <Label class="ui:text-muted-foreground text-xs">{$t('learningPath.landing.faqs.answer')}</Label>
              <Textarea
                value={item.answer}
                placeholder={$t('learningPath.landing.faqs.answer_placeholder')}
                rows={3}
                class="mt-1 text-xs"
                oninput={(e) => handleUpdateItem(index, { answer: (e.currentTarget as HTMLTextAreaElement).value })}
              />
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <AddSectionButton label={$t('learningPath.landing.faqs.add')} onclick={handleAdd} />
  </div>
</div>
