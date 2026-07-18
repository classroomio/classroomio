<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import debounce from 'lodash/debounce';
  import ColorPicker from 'svelte-awesome-color-picker';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { orgApi } from '$features/org/api/org.svelte';
  import { snackbar } from '$features/ui/snackbar/store';

  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { Button } from '@cio/ui/base/button';
  import { UploadImage, UnsavedChanges } from '$features/ui';
  import * as Field from '@cio/ui/base/field';

  let avatar = $state<string | File | undefined>();
  let hasUnsavedChanges = $state(false);
  let shareNewNotesWithTeam = $state(getShareNewNotesWithTeam($currentOrg?.settings));
  let isSavingNotesSettings = $state(false);

  function getShareNewNotesWithTeam(settings: unknown) {
    const notesSettings = (settings as { notes?: { defaultVisibility?: string } } | null | undefined)?.notes;

    return notesSettings?.defaultVisibility === 'team';
  }

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

  async function handleSaveNotesSettings() {
    if (!$currentOrg?.id) {
      return;
    }

    isSavingNotesSettings = true;
    const existingSettings = ($currentOrg.settings as Record<string, unknown>) || {};
    const existingNotes = (existingSettings.notes as Record<string, unknown>) || {};

    await orgApi.update(
      $currentOrg.id,
      {
        settings: {
          ...existingSettings,
          notes: {
            ...existingNotes,
            defaultVisibility: shareNewNotesWithTeam ? 'team' : 'private'
          }
        }
      },
      {
        onSuccess: () => {
          snackbar.success(t.get('snackbar.success_update'));
        }
      }
    );
    isSavingNotesSettings = false;
  }

  $effect(() => {
    shareNewNotesWithTeam = getShareNewNotesWithTeam($currentOrg?.settings);
  });

  let isCustomTheme = $derived($currentOrg?.theme?.includes('#'));
  let hex = $derived($currentOrg.theme?.includes('#') ? $currentOrg.theme : undefined);
  let notesSettingsDirty = $derived(shareNewNotesWithTeam !== getShareNewNotesWithTeam($currentOrg?.settings));
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Field.Group class="w-full max-w-md! px-2">
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
          class="cursor-pointer rounded-full border-2 {$currentOrg.theme === themes.blue &&
            'border-[#1d4ee2]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.blue)}
          aria-label="Default blue theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#1d4ee2] md:h-6 md:w-6"></div>
        </button>

        <button
          class="cursor-pointer rounded-full border-2 {$currentOrg.theme === themes.rose &&
            'border-[#be1241]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.rose)}
          aria-label="Rose theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#be1241] md:h-6 md:w-6"></div>
        </button>

        <button
          class="cursor-pointer rounded-full border-2 {$currentOrg.theme === themes.green &&
            'border-[#0c891b]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.green)}
          aria-label="Green theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#0c891b] md:h-6 md:w-6"></div>
        </button>

        <button
          class="cursor-pointer rounded-full border-2 {$currentOrg.theme === themes.orange &&
            'border-[#cc4902]'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.orange)}
          aria-label="Orange theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-[#cc4902] md:h-6 md:w-6"></div>
        </button>

        <button
          class="cursor-pointer rounded-full border-2 {$currentOrg.theme === themes.purple &&
            'border-purple-600'} flex h-fit items-center justify-center"
          onclick={handleChangeTheme(themes.purple)}
          aria-label="Purple theme"
        >
          <div class="m-1 h-6 w-6 rounded-full bg-purple-600 md:h-6 md:w-6"></div>
        </button>

        <div
          style={isCustomTheme ? `border-color: ${$currentOrg.theme};` : ''}
          class="group relative h-auto w-fit cursor-pointer rounded-full border-2 {!isCustomTheme
            ? 'custom-theme-picker--empty'
            : ''}"
        >
          <!-- plus icon positioned over the color picker -->
          <div
            class="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          >
            <PlusIcon class="z-10 size-6 {hex ? 'stroke-white' : 'stroke-gray-500'}" />
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
    <Field.Legend class="flex items-center gap-2">
      <FileTextIcon class="size-5" />
      {$t('settings.organization.notes.heading')}
    </Field.Legend>
    <Field.Description>{$t('settings.organization.notes.description')}</Field.Description>

    <Field.Field orientation="horizontal">
      <Switch bind:checked={shareNewNotesWithTeam} disabled={isSavingNotesSettings} />
      <div class="space-y-0.5">
        <Field.Label>{$t('settings.organization.notes.share_by_default.label')}</Field.Label>
        <Field.Description>
          {$t('settings.organization.notes.share_by_default.description')}
        </Field.Description>
      </div>
    </Field.Field>

    {#if notesSettingsDirty}
      <Button loading={isSavingNotesSettings} onclick={handleSaveNotesSettings}>
        {$t('settings.organization.notes.save')}
      </Button>
    {/if}
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

  :global(.color::before) {
    display: none;
  }

  :global(.custom-theme-picker--empty .color) {
    background-color: #e5e7eb !important;
  }

  :global(.dark .custom-theme-picker--empty .color) {
    background-color: #374151 !important;
  }
</style>
