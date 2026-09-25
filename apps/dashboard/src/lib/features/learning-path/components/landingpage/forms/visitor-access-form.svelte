<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import { cn } from '@cio/ui/tools';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';

  interface Props {
    landingPage: TLandingPage;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let { landingPage, onChange }: Props = $props();

  const currentAccess = $derived(landingPage.visitorAccess ?? 'syllabus');

  const options: Array<{
    value: 'teaser' | 'syllabus' | 'preview';
    titleKey: string;
    descKey: string;
    comingSoon?: boolean;
  }> = [
    {
      value: 'teaser',
      titleKey: 'learningPath.landing.access.teaser_title',
      descKey: 'learningPath.landing.access.teaser_desc'
    },
    {
      value: 'syllabus',
      titleKey: 'learningPath.landing.access.syllabus_title',
      descKey: 'learningPath.landing.access.syllabus_desc'
    },
    {
      value: 'preview',
      titleKey: 'learningPath.landing.access.preview_title',
      descKey: 'learningPath.landing.access.preview_desc',
      comingSoon: true
    }
  ];

  function selectOption(val: 'teaser' | 'syllabus' | 'preview', comingSoon?: boolean) {
    if (comingSoon) return;
    onChange({ visitorAccess: val });
  }
</script>

<div class="space-y-2.5">
  <p class="ui:text-muted-foreground mb-3 text-xs">
    {$t('learningPath.landing.access.description')}
  </p>

  {#each options as opt (opt.value)}
    {@const isSelected = currentAccess === opt.value}
    <button
      type="button"
      class={cn(
        'ui:border-border flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all',
        opt.comingSoon ? 'ui:bg-muted/20 cursor-not-allowed opacity-60' : 'ui:hover:bg-muted/50 cursor-pointer',
        isSelected && !opt.comingSoon && 'ui:border-primary ui:bg-primary/5'
      )}
      onclick={() => selectOption(opt.value, opt.comingSoon)}
      disabled={opt.comingSoon}
      aria-pressed={isSelected}
    >
      <span
        class={cn(
          'ui:border-input mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]',
          isSelected && !opt.comingSoon && 'ui:border-primary'
        )}
      >
        {#if isSelected && !opt.comingSoon}
          <span class="ui:bg-primary size-2 rounded-full"></span>
        {/if}
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">{$t(opt.titleKey)}</span>
          {#if opt.comingSoon}
            <Badge variant="outline" class="h-4.5 px-1.5 py-0 text-[10px] font-semibold tracking-wider uppercase">
              {$t('common.coming_soon')}
            </Badge>
          {/if}
        </div>
        <div class="ui:text-muted-foreground mt-0.5 text-xs">{$t(opt.descKey)}</div>
      </div>
    </button>
  {/each}
</div>
