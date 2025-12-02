<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import debounce from 'lodash/debounce';
  import ColorPicker from 'svelte-awesome-color-picker';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { injectCustomTheme, setCustomTheme, setTheme } from '$lib/utils/functions/theme';
  import { orgApi } from '$lib/features/org/api/org.svelte';

  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';
  import * as Field from '@cio/ui/base/field';

  let avatar = $state<string | File | undefined>();
  let hasUnsavedChanges = $state(false);
  let hex = $state('');

  $effect(() => {
    const theme = $currentOrg.theme;

    // if not a custom theme, don't update hex
    if (!theme || theme.includes('theme-')) return;

    // only update hex with value of `theme` when theme changes not when HEX changes
    untrack(() => {
      hex = theme;
    });
  });

  const themes = {
    rose: 'theme-rose',
    green: 'theme-green',
    orange: 'theme-orange',
    violet: 'theme-violet',
    default: ''
  };

  const saveTheme = debounce(async (theme: string) => {
    await orgApi.update($currentOrg.id, {
      theme
    });
  }, 700);

  function handleChangeTheme(t = '') {
    return async () => {
      document.body.className = document.body.className
        .split(' ')
        .filter((c) => !c.includes('theme'))
        .join(' ')
        .concat(t ? ' ' : '', t);
      $currentOrg.theme = t;

      hex = '';

      setTheme(t);

      saveTheme(t);
    };
  }

  async function handleCustomTheme() {
    if (!hex) return;

    injectCustomTheme(hex);
    setCustomTheme('theme-custom');

    $currentOrg.theme = hex;

    saveTheme(hex);
  }

  export async function handleUpdate() {
    await orgApi.update($currentOrg.id, {
      name: $currentOrg.name,
      avatar
    });

    if (orgApi.success) {
      hasUnsavedChanges = false;
      avatar = undefined;
    }
  }

  function gotoSettings(pathname: string) {
    goto(`${$currentOrgPath}/settings${pathname}`);
  }

  let isCustomTheme = $derived(hex && !hex.includes('theme-'));
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.organization.organization_profile.organization_name')}</Field.Label>
        <Input bind:value={$currentOrg.name} oninput={() => (hasUnsavedChanges = true)} class="w-full lg:w-60" />
        {#if orgApi.errors.name}
          <Field.Error>{$t(orgApi.errors.name)}</Field.Error>
        {/if}
      </Field.Field>
      <Field.Field>
        <UploadImage
          bind:avatar
          src={$currentOrg.avatarUrl}
          shape="rounded-md"
          widthHeight="w-24 h-24"
          change={() => (hasUnsavedChanges = true)}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.organization.organization_profile.theme.heading')}</Field.Legend>
    <Field.Description>{$t('settings.organization.organization_profile.theme.sub_heading')}</Field.Description>
    <Field.Field>
      <div class="flex items-center gap-5">
        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.default &&
            'border-[#1d4ee2]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.default)}
          aria-label="Default blue theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#1d4ee2] md:h-6 md:w-6"></div>
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.rose &&
            'border-[#be1241]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.rose)}
          aria-label="Rose theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#be1241] md:h-6 md:w-6"></div>
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.green &&
            'border-[#0c891b]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.green)}
          aria-label="Green theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#0c891b] md:h-6 md:w-6"></div>
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.orange &&
            'border-[#cc4902]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.orange)}
          aria-label="Orange theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#cc4902] md:h-6 md:w-6"></div>
        </button>

        <button
          class="rounded-full border-2 {$currentOrg.theme === themes.violet &&
            'border-[#cf00ce]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.violet)}
          aria-label="Violet theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#cf00ce] md:h-6 md:w-6"></div>
        </button>

        <div
          class="h-auto w-fit border-2 {isCustomTheme
            ? 'border-primary-700'
            : 'dark:border-neutral-700'} group relative rounded-full"
        >
          <!-- plus icon positioned over the color picker -->
          <div
            class="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          >
            <svg
              class="h-6 w-6 text-{isCustomTheme ? 'white' : 'black'} z-10 opacity-100 dark:text-white"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <ColorPicker position="responsive" label="" bind:hex on:input={handleCustomTheme} />
        </div>
      </div>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.organization.organization_profile.customize_lms.heading')}</Field.Legend>
    <Field.Description>{$t('settings.organization.organization_profile.customize_lms.sub_heading')}</Field.Description>
    <Field.Description>{$t('settings.organization.organization_profile.customize_lms.body')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Button variant="outline" onclick={() => gotoSettings('/customize-lms')}>
        {$t('settings.organization.organization_profile.customize_lms.button')}
      </Button>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.organization.organization_profile.custom_domain.heading')}</Field.Legend>
    <Field.Description>{$t('settings.organization.organization_profile.custom_domain.sub_heading')}</Field.Description>
    <Field.Description>{$t('settings.organization.organization_profile.custom_domain.body')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Button variant="outline" onclick={() => gotoSettings('/domains')}>
        {#if $isFreePlan}
          <ZapIcon size={16} class="filled" />
        {/if}
        {$t('settings.organization.organization_profile.custom_domain.button')}
      </Button>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.organization.organization_profile.team.heading')}</Field.Legend>
    <Field.Description>{$t('settings.organization.organization_profile.team.sub_heading')}</Field.Description>
    <Field.Description>{$t('settings.organization.organization_profile.team.body')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Button variant="outline" onclick={() => gotoSettings('/teams')}>
        {#if $isFreePlan}
          <ZapIcon size={16} class="filled" />
        {/if}
        {$t('settings.organization.organization_profile.team.button')}
      </Button>
    </Field.Field>
  </Field.Set>
</Field.Group>

<style>
  :global(.dark) {
    --cp-text-color: #fff;
    --cp-border-color: white;
    --cp-text-color: white;
    --cp-input-color: #555;
    --cp-button-hover-color: #777;
  }

  :global(.dark .alpha) {
    background: #333 !important;
  }
</style>
