<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import StarIcon from '@lucide/svelte/icons/star';
  import { t } from '$lib/utils/functions/translations';
  import type { TLandingPage, TLandingPageReview } from '@cio/utils/validation/learning-path';
  import { AddSectionButton } from '$features/ui';
  import { parseInitialPathReviews } from '../../../utils/landing-page-utils';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  let reviews = $state<TLandingPageReview[]>(parseInitialPathReviews(landingPage));
  let expandedIndex = $state<number | null>(null);

  $effect(() => {
    const next = parseInitialPathReviews(landingPage);
    if (JSON.stringify(next) !== JSON.stringify(reviews)) reviews = next;
  });

  function handleAdd() {
    const newItem: TLandingPageReview = {
      id: Date.now(),
      name: '',
      avatar_url: '',
      rating: 5,
      created_at: Date.now(),
      description: '',
      hide: false
    };
    const next = [...reviews, newItem];
    reviews = next;
    expandedIndex = next.length - 1;
    onChange({ reviews: next });
  }

  function handleRemove(index: number) {
    const next = reviews.filter((_, i) => i !== index);
    reviews = next;
    if (expandedIndex === index) {
      expandedIndex = null;
    } else if (expandedIndex !== null && expandedIndex > index) {
      expandedIndex--;
    }
    onChange({ reviews: next });
  }

  function handleUpdateItem(index: number, patch: Partial<TLandingPageReview>) {
    const next = [...reviews];
    next[index] = {
      ...next[index],
      ...patch
    };
    reviews = next;
    onChange({ reviews: next });
  }
</script>

<div class="space-y-4">
  <div class="space-y-3">
    {#each reviews as item, index (item.id)}
      {@const isExpanded = expandedIndex === index}
      <div class="ui:border-border rounded-lg border p-3">
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            class="flex flex-1 cursor-pointer items-center justify-between text-left text-sm font-medium"
            onclick={() => (expandedIndex = isExpanded ? null : index)}
          >
            <div class="flex items-center gap-2 truncate">
              <span class="truncate">
                {item.name || $t('learningPath.landing.reviews.untitled')}
              </span>
              {#if item.rating !== null}
                <div class="flex items-center text-amber-500">
                  {#each Array(item.rating) as _, starIdx (starIdx)}
                    <StarIcon size={12} class="fill-current text-amber-500" />
                  {/each}
                </div>
              {/if}
            </div>
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
              <Label class="ui:text-muted-foreground text-xs">
                {$t('learningPath.landing.reviews.fullname')}
              </Label>
              <Input
                value={item.name}
                placeholder={$t('learningPath.landing.reviews.name_placeholder')}
                class="mt-1 h-8 text-xs"
                oninput={(e) => handleUpdateItem(index, { name: (e.currentTarget as HTMLInputElement).value })}
              />
            </div>
            <div>
              <Label class="ui:text-muted-foreground text-xs">
                {$t('learningPath.landing.reviews.avatar_url')}
              </Label>
              <Input
                value={item.avatar_url}
                placeholder={$t('learningPath.landing.reviews.avatar_placeholder')}
                class="mt-1 h-8 text-xs"
                oninput={(e) => handleUpdateItem(index, { avatar_url: (e.currentTarget as HTMLInputElement).value })}
              />
            </div>
            <div>
              <div class="flex items-center justify-between">
                <Label class="ui:text-muted-foreground text-xs">
                  {$t('learningPath.landing.reviews.rating')}
                </Label>
                {#if item.rating !== null}
                  <button
                    type="button"
                    class="ui:text-muted-foreground ui:hover:text-foreground cursor-pointer text-[11px] underline"
                    onclick={() => handleUpdateItem(index, { rating: null })}
                  >
                    {$t('learningPath.landing.reviews.clear_rating')}
                  </button>
                {/if}
              </div>
              <Input
                type="number"
                min="1"
                max="5"
                value={item.rating ?? ''}
                placeholder={$t('learningPath.landing.reviews.rating_placeholder')}
                class="mt-1 h-8 text-xs"
                oninput={(e) => {
                  const val = (e.currentTarget as HTMLInputElement).value;
                  const parsed = val === '' ? null : Math.max(1, Math.min(5, Number(val) || 5));
                  handleUpdateItem(index, { rating: parsed });
                }}
              />
            </div>
            <div>
              <Label class="ui:text-muted-foreground text-xs">
                {$t('learningPath.landing.reviews.description')}
              </Label>
              <Textarea
                value={item.description}
                placeholder={$t('learningPath.landing.reviews.description_placeholder')}
                rows={3}
                class="mt-1 text-xs"
                oninput={(e) =>
                  handleUpdateItem(index, { description: (e.currentTarget as HTMLTextAreaElement).value })}
              />
            </div>
            <div class="flex items-center justify-between pt-1">
              <Label class="ui:text-muted-foreground text-xs">
                {item.hide ? $t('settings.landing_page.hide_section') : $t('settings.landing_page.show_section')}
              </Label>
              <Switch checked={!item.hide} onCheckedChange={(checked) => handleUpdateItem(index, { hide: !checked })} />
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <AddSectionButton label={$t('learningPath.landing.reviews.add_reviews')} onclick={handleAdd} />
  </div>
</div>
