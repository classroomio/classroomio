<script lang="ts">
  import { browser } from '$app/environment';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import { orgApi } from '$features/org/api/org.svelte';
  import {
    announcementSettingsStore,
    PRESET_BANNER_COLORS,
    DEFAULT_ANNOUNCEMENT_SETTINGS,
    type AnnouncementSettings
  } from '$features/plugins/store/plugin-settings';
  import { Sparkles, ArrowRight, X, Palette, BellRing, Settings2 } from '@lucide/svelte';

  let settings = $state<AnnouncementSettings>({ ...DEFAULT_ANNOUNCEMENT_SETTINGS });
  let focusModeDefault = $state(true);
  let instantCertDownload = $state(true);
  let isSaving = $state(false);

  // Sync settings when org is loaded
  $effect(() => {
    if (browser && $currentOrg?.id) {
      const serverAnnouncement = $currentOrg.customization?.announcement;
      announcementSettingsStore.init($currentOrg.id, serverAnnouncement);
      const unsub = announcementSettingsStore.subscribe((val) => {
        settings = { ...val };
      });
      return unsub;
    }
  });

  function selectPresetColor(color: string) {
    settings.backgroundColor = color;
  }

  async function handleSave() {
    isSaving = true;
    try {
      announcementSettingsStore.save(settings, $currentOrg?.id);
      if ($currentOrg?.id) {
        await orgApi.update($currentOrg.id, {
          customization: {
            ...$currentOrg.customization,
            announcement: settings
          }
        });
      }
      snackbar.success('plugins.settings_saved');
    } finally {
      isSaving = false;
    }
  }

  async function handleReset() {
    settings = { ...DEFAULT_ANNOUNCEMENT_SETTINGS };
    announcementSettingsStore.save(settings, $currentOrg?.id);
    if ($currentOrg?.id) {
      await orgApi.update($currentOrg.id, {
        customization: {
          ...$currentOrg.customization,
          announcement: settings
        }
      });
    }
    snackbar.success('plugins.settings_reset');
  }
</script>

<svelte:head>
  <title>Plugin & Extension Settings - ClassroomIO</title>
</svelte:head>

<div class="w-full min-w-0 space-y-6">
  <!-- Page Header -->
  <Page.Header class="my-0 border-b border-slate-200 pb-4 dark:border-slate-800">
    <Page.HeaderContent>
      <Page.Title>{$t('plugins.settings_title')}</Page.Title>
      <Page.Subtitle>{$t('plugins.settings_description')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action class="gap-3">
      <Button variant="outline" size="sm" onclick={handleReset}>
        {$t('plugins.reset_btn')}
      </Button>
      <Button variant="primary" size="sm" onclick={handleSave} disabled={isSaving}>
        {isSaving ? $t('common.saving') : $t('plugins.save_btn')}
      </Button>
    </Page.Action>
  </Page.Header>

  <!-- Announcement Banner Customization -->
  <Field.Group class="space-y-6">
    <Field.Set
      class="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div
          class="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        >
          <Palette class="size-4" />
        </div>
        <div>
          <Field.Legend class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {$t('plugins.announcement_section')}
          </Field.Legend>
          <Field.Description class="text-xs text-slate-500 dark:text-slate-400">
            {$t('plugins.announcement_desc')}
          </Field.Description>
        </div>
      </div>

      <div class="mt-5 space-y-5">
        <!-- Live Interactive Preview -->
        <div>
          <span class="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {$t('plugins.announcement_preview')}
          </span>
          <div class="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
            <aside
              class="w-full px-4 py-2.5 text-white shadow-xs transition-colors duration-200"
              style="background-color: {settings.backgroundColor};"
              aria-label="Announcement Preview"
            >
              <div class="flex items-center justify-between gap-3 text-sm">
                <div class="flex items-center gap-2.5 overflow-hidden">
                  <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-xs"
                  >
                    <Sparkles class="h-3.5 w-3.5 fill-current" />
                  </span>
                  <div class="flex items-center gap-2 truncate">
                    <span
                      class="text-2xs rounded-full border border-white/30 bg-white/20 px-2 py-0.5 font-bold tracking-wide text-white uppercase backdrop-blur-xs"
                    >
                      New
                    </span>
                    <p class="truncate font-medium text-white drop-shadow-xs">
                      {settings.mode === 'custom' && settings.customMessage
                        ? settings.customMessage
                        : 'New Course Published: "Modern Web Development with React" is now open for enrollment!'}
                    </p>
                  </div>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-2xs"
                  >
                    <span>{settings.customLinkText || 'Start Learning'}</span>
                    <ArrowRight class="h-3.5 w-3.5 text-slate-700" />
                  </span>
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md text-white transition-opacity hover:bg-white/20"
                    aria-label="Dismiss banner preview"
                  >
                    <X class="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <!-- Banner Color Selection -->
        <Field.Field>
          <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {$t('plugins.announcement_bg_color')}
          </Field.Label>
          <div class="mt-2 flex flex-wrap items-center gap-2.5">
            {#each PRESET_BANNER_COLORS as preset}
              <button
                type="button"
                onclick={() => selectPresetColor(preset.value)}
                class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all {settings.backgroundColor ===
                preset.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'dark:bg-slate-850 border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'}"
              >
                <span class="size-4 shrink-0 rounded-full shadow-xs" style="background-color: {preset.value}"></span>
                <span>{preset.label}</span>
              </button>
            {/each}

            <!-- Custom Color Picker -->
            <div
              class="dark:bg-slate-850 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-800"
            >
              <input
                type="color"
                bind:value={settings.backgroundColor}
                class="size-6 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                title="Choose custom color"
              />
              <span class="font-mono text-xs text-slate-600 dark:text-slate-400">
                {settings.backgroundColor}
              </span>
            </div>
          </div>
        </Field.Field>

        <!-- Banner Mode Selection -->
        <Field.Field>
          <Field.Label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {$t('plugins.announcement_mode')}
          </Field.Label>
          <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onclick={() => (settings.mode = 'dynamic')}
              class="flex flex-col items-start rounded-lg border p-3.5 text-left transition-all {settings.mode ===
              'dynamic'
                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40'
                : 'dark:bg-slate-850 border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800'}"
            >
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <BellRing class="size-3.5 text-blue-600" />
                <span>{$t('plugins.announcement_mode_dynamic')}</span>
              </div>
              <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {$t('plugins.announcement_mode_dynamic_desc')}
              </p>
            </button>

            <button
              type="button"
              onclick={() => (settings.mode = 'custom')}
              class="flex flex-col items-start rounded-lg border p-3.5 text-left transition-all {settings.mode ===
              'custom'
                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40'
                : 'dark:bg-slate-850 border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800'}"
            >
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <Settings2 class="size-3.5 text-blue-600" />
                <span>{$t('plugins.announcement_mode_custom')}</span>
              </div>
              <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {$t('plugins.announcement_mode_custom_desc')}
              </p>
            </button>
          </div>
        </Field.Field>

        {#if settings.mode === 'custom'}
          <div
            class="dark:bg-slate-850/40 space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800"
          >
            <Field.Field>
              <Field.Label class="text-xs font-semibold">{$t('plugins.custom_message_label')}</Field.Label>
              <Input
                bind:value={settings.customMessage}
                placeholder="Welcome! Check out our new interactive labs."
                class="mt-1 h-8 text-xs"
              />
            </Field.Field>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field.Field>
                <Field.Label class="text-xs font-semibold">{$t('plugins.custom_link_text')}</Field.Label>
                <Input bind:value={settings.customLinkText} placeholder="Start Learning" class="mt-1 h-8 text-xs" />
              </Field.Field>

              <Field.Field>
                <Field.Label class="text-xs font-semibold">{$t('plugins.custom_link_url')}</Field.Label>
                <Input bind:value={settings.customLinkUrl} placeholder="/explore" class="mt-1 h-8 text-xs" />
              </Field.Field>
            </div>
          </div>
        {/if}
      </div>
    </Field.Set>

    <!-- General Plugin Behaviors -->
    <Field.Set
      class="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div
          class="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        >
          <Settings2 class="size-4" />
        </div>
        <div>
          <Field.Legend class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {$t('plugins.general_preferences')}
          </Field.Legend>
          <Field.Description class="text-xs text-slate-500 dark:text-slate-400">
            {$t('plugins.general_preferences_desc')}
          </Field.Description>
        </div>
      </div>

      <div class="mt-4 space-y-4">
        <Field.Field orientation="horizontal" class="items-center justify-between py-2">
          <div>
            <Field.Label class="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {$t('plugins.focus_mode_default')}
            </Field.Label>
            <Field.Description class="text-xs text-slate-500 dark:text-slate-400">
              {$t('plugins.focus_mode_default_desc')}
            </Field.Description>
          </div>
          <Switch bind:checked={focusModeDefault} />
        </Field.Field>

        <Field.Field
          orientation="horizontal"
          class="items-center justify-between border-t border-slate-100 py-2 dark:border-slate-800"
        >
          <div>
            <Field.Label class="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {$t('plugins.instant_cert_download')}
            </Field.Label>
            <Field.Description class="text-xs text-slate-500 dark:text-slate-400">
              {$t('plugins.instant_cert_download_desc')}
            </Field.Description>
          </div>
          <Switch bind:checked={instantCertDownload} />
        </Field.Field>
      </div>
    </Field.Set>
  </Field.Group>
</div>
