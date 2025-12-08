<script lang="ts">
  import { goto } from '$app/navigation';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import debounce from 'lodash/debounce';
  import ColorPicker from 'svelte-awesome-color-picker';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { orgApi } from '$lib/features/org/api/org.svelte';

  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';
  import * as Field from '@cio/ui/base/field';

  let avatar = $state<string | File | undefined>();
  let hasUnsavedChanges = $state(false);

  const themes = {
    rose: 'rose',
    green: 'green',
    orange: 'orange',
    purple: 'purple',
    blue: 'blue'
  };

  const updateThemeApi = debounce(async (theme: string) => {
    console.log('saving theme', theme);
    await orgApi.update(
      $currentOrg.id,
      {
        theme
      },
      {
        onSuccess: () => {}
      }
    );
  }, 2000);

  function handleChangeTheme(t = '') {
    return () => {
      if (t === $currentOrg.theme) return;

      $currentOrg.theme = t;

      setTheme(t);

      updateThemeApi(t);
    };
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
  let isCustomTheme = $derived($currentOrg?.theme?.includes('#'));

  $effect(() => {
    console.log('$currentOrg?.theme', $currentOrg?.theme);
    console.log('isCustomTheme', isCustomTheme);
  });
  let hex = $derived($currentOrg.theme.includes('#') ? $currentOrg.theme : undefined);
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
          class="rounded-full border-2 {$currentOrg.theme === themes.blue &&
            'border-[#1d4ee2]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.blue)}
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
          class="rounded-full border-2 {$currentOrg.theme === themes.purple &&
            'border-purple-600'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.purple)}
          aria-label="Purple theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-purple-600 md:h-6 md:w-6"></div>
        </button>

        <div
          style={`border-color: ${isCustomTheme ? $currentOrg.theme : 'dark:border-neutral-700'};`}
          class="group relative h-auto w-fit rounded-full border-2"
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
          <ColorPicker
            position="responsive"
            label=""
            {hex}
            on:input={(e) => {
              console.log('hex changed', e.detail.hex);
              handleChangeTheme(e.detail.hex)();
            }}
          />
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
