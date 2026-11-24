<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import * as Popover from '@cio/ui/base/popover';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { FileDropZone, FileDropZoneTrigger, ACCEPT_IMAGE } from '@cio/ui/custom/file-drop-zone';
  import CheckIcon from '@lucide/svelte/icons/check';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import { cn } from '@cio/ui/tools';
  import { ONBOARDING_BRAND_PRESETS } from '@cio/utils/constants/onboarding';
  import type { TOnboardingBrandColour } from '@cio/utils/validation/onboarding';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { brandHex, brandPrimary, PRESET_PRIMARY } from '$features/onboarding/utils/customise-colour';
  import CustomiseColourEditor from './customise-colour-editor.svelte';

  interface Props {
    orgName: string;
    nameError: string;
    initials: string;
    logoUrl: string | null;
    detectedLogoUrl: string | null;
    brandColour: TOnboardingBrandColour;
    detectedColour: string | null;
    colourAdjusted: boolean;
    onLogoFile: (file: File) => void;
    onLogoClear: () => void;
    onUseDetectedLogo: () => void;
    onColourChange: (colour: TOnboardingBrandColour) => void;
    onReset: () => void;
  }

  let {
    orgName = $bindable(),
    nameError,
    initials,
    logoUrl,
    detectedLogoUrl,
    brandColour,
    detectedColour,
    colourAdjusted,
    onLogoFile,
    onLogoClear,
    onUseDetectedLogo,
    onColourChange,
    onReset
  }: Props = $props();

  let pill = $state<HTMLDivElement | null>(null);
  let isBrandOpen = $state(false);
  let isColourOpen = $state(false);

  const isNarrow = new MediaQuery('max-width: 900px');
  const popoverAlign = $derived(isNarrow.current ? 'center' : 'start');

  const swatches = $derived<Array<{ value: TOnboardingBrandColour; label: string }>>([
    ...ONBOARDING_BRAND_PRESETS.map((preset) => ({
      value: preset,
      label: $t(`onboarding.v2.customise.colours.${preset}`)
    })),
    ...(detectedColour ? [{ value: detectedColour, label: $t('onboarding.v2.customise.colour_from_website') }] : [])
  ]);

  const currentHex = $derived(brandHex(brandColour));
  const showAdjustedNote = $derived(colourAdjusted && Boolean(detectedColour) && brandColour === detectedColour);

  function swatchColour(value: TOnboardingBrandColour) {
    return value in PRESET_PRIMARY ? brandPrimary(value) : value;
  }

  function handleSwatchKeydown(event: KeyboardEvent, index: number) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (index + step + swatches.length) % swatches.length;
    onColourChange(swatches[nextIndex].value);

    const group = (event.currentTarget as HTMLElement).parentElement;
    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus();
  }

  async function handleUpload(files: File[]) {
    const [file] = files;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      snackbar.error('onboarding.v2.customise.logo_not_image');
      return;
    }

    onLogoFile(file);
  }

  function handleRejected() {
    snackbar.error('onboarding.v2.customise.logo_not_image');
  }
</script>

<div
  bind:this={pill}
  class="ui:bg-card ui:border-border relative flex w-fit max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 rounded-full border p-1.5 pr-2.5 max-[900px]:w-full max-[900px]:rounded-[20px] max-[900px]:p-2"
  data-testid="onboarding-customise-pill"
>
  <Popover.Root bind:open={isBrandOpen}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="ui:text-foreground ui:hover:bg-accent ui:focus-visible:outline-ring inline-flex items-center gap-2 rounded-full py-[5px] pr-2.5 pl-[5px] text-[13px] focus-visible:outline-2 focus-visible:outline-offset-1 aria-expanded:bg-[var(--accent)]"
          aria-label={$t('onboarding.v2.customise.edit_name')}
          data-testid="onboarding-customise-brand"
        >
          <span
            class="ui:bg-primary ui:text-primary-foreground grid size-[26px] shrink-0 place-items-center overflow-hidden rounded-full text-[10.5px] font-bold"
          >
            {#if logoUrl}
              <img src={logoUrl} alt="" class="size-full bg-white object-contain" />
            {:else}
              {initials}
            {/if}
          </span>
          <b class="max-w-48 truncate font-semibold">{orgName}</b>
          <PencilIcon class="ui:text-muted-foreground custom size-3" />
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      customAnchor={pill}
      side="top"
      align={popoverAlign}
      sideOffset={10}
      class="w-[330px] rounded-[14px] p-3.5 max-[900px]:w-[min(330px,calc(100vw-40px))]"
    >
      <InputField
        label={$t('onboarding.v2.customise.name_label')}
        name="onboarding-customise-name"
        testId="onboarding-customise-name"
        bind:value={orgName}
        errorMessage={nameError}
      />

      <div class="mt-2.5">
        {#if logoUrl}
          <div class="ui:border-border ui:bg-card flex items-center gap-2.5 rounded-[10px] border p-2.5">
            <img src={logoUrl} alt="" class="ui:bg-muted size-9 rounded-md object-contain" />
            <div class="min-w-0 flex-1">
              <div class="text-[12.5px] font-[550]">{$t('onboarding.v2.customise.logo_added')}</div>
              <div class="ui:text-muted-foreground text-[11.5px]">{$t('onboarding.v2.customise.logo_shown')}</div>
            </div>
            <Button variant="ghost" size="sm" onclick={onLogoClear}>
              {$t('onboarding.v2.customise.logo_remove')}
            </Button>
          </div>
        {:else}
          <FileDropZone accept={ACCEPT_IMAGE} maxFiles={1} onUpload={handleUpload} onFileRejected={handleRejected}>
            <FileDropZoneTrigger
              class="ui:border-border ui:bg-card ui:hover:border-primary block cursor-pointer rounded-[10px] border-[1.5px] border-dashed p-[18px] text-center transition-colors hover:bg-[color-mix(in_oklab,var(--primary)_5%,var(--card))]"
              data-testid="onboarding-customise-logo"
            >
              <UploadIcon class="ui:text-muted-foreground custom mx-auto mb-1.5 block size-[18px]" strokeWidth={1.8} />
              <div class="text-[12.5px] font-[550]">{$t('onboarding.v2.customise.logo_drop')}</div>
              <div class="ui:text-muted-foreground mt-0.5 text-[11.5px]">
                {$t('onboarding.v2.customise.logo_choose')}
              </div>
            </FileDropZoneTrigger>
          </FileDropZone>
          {#if detectedLogoUrl}
            <Button variant="ghost" size="sm" class="mt-2 w-full" onclick={onUseDetectedLogo}>
              {$t('onboarding.v2.customise.logo_use_detected')}
            </Button>
          {/if}
        {/if}
      </div>
    </Popover.Content>
  </Popover.Root>

  <span class="ui:bg-border h-[22px] w-px max-[900px]:hidden"></span>

  <span class="ui:text-muted-foreground text-xs whitespace-nowrap">{$t('onboarding.v2.customise.colour_label')}</span>

  <span
    class="flex gap-2 max-[900px]:flex-wrap max-[900px]:justify-center"
    role="radiogroup"
    aria-label={$t('onboarding.v2.customise.colour_presets_label')}
  >
    {#each swatches as swatch, index (swatch.value)}
      {@const isChecked = brandColour === swatch.value}
      <button
        type="button"
        role="radio"
        aria-checked={isChecked}
        aria-label={swatch.label}
        title={swatch.label}
        tabindex={isChecked || (index === 0 && !swatches.some((item) => item.value === brandColour)) ? 0 : -1}
        class={cn(
          'ui:focus-visible:outline-ring grid size-6 cursor-pointer place-items-center rounded-full border-2 p-0 text-white focus-visible:outline-2 focus-visible:outline-offset-[3px]',
          isChecked ? 'border-[var(--card)]' : 'border-transparent shadow-[0_0_0_1px_var(--border)]'
        )}
        style:background-color={swatchColour(swatch.value)}
        style:box-shadow={isChecked ? `0 0 0 2px ${swatchColour(swatch.value)}` : undefined}
        data-testid={`onboarding-customise-swatch-${index}`}
        onclick={() => onColourChange(swatch.value)}
        onkeydown={(event) => handleSwatchKeydown(event, index)}
      >
        <CheckIcon class={cn('custom size-[11px]', !isChecked && 'opacity-0')} />
      </button>
    {/each}
  </span>

  <Popover.Root bind:open={isColourOpen}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="ui:text-foreground ui:hover:bg-accent ui:focus-visible:outline-ring inline-flex items-center gap-2 rounded-full py-[5px] pr-2.5 pl-[5px] text-[13px] focus-visible:outline-2 focus-visible:outline-offset-1 aria-expanded:bg-[var(--accent)]"
          data-testid="onboarding-customise-custom"
        >
          <i
            class="size-4 rounded-full shadow-[0_0_0_1px_var(--border)]"
            style:background-color={swatchColour(brandColour)}
          ></i>
          {$t('onboarding.v2.customise.colour_custom')}
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      customAnchor={pill}
      side="top"
      align={popoverAlign}
      sideOffset={10}
      class="w-[330px] rounded-[14px] p-3.5 max-[900px]:w-[min(330px,calc(100vw-40px))]"
    >
      <CustomiseColourEditor hex={currentHex} {showAdjustedNote} onChange={onColourChange} />
    </Popover.Content>
  </Popover.Root>

  <span class="ui:bg-border h-[22px] w-px max-[900px]:hidden"></span>

  <button
    type="button"
    class="ui:text-muted-foreground ui:hover:bg-accent ui:focus-visible:outline-ring rounded-full py-[5px] pr-2.5 pl-2.5 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-1"
    data-testid="onboarding-customise-reset"
    onclick={onReset}
  >
    {$t('onboarding.v2.customise.reset')}
  </button>
</div>
