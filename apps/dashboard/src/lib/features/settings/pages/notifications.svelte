<script lang="ts">
  import {
    EMAIL_NOTIFICATION_TOGGLE_KEYS,
    ORG_EMAIL_NOTIFICATION_SECTIONS,
    PERSONAL_EMAIL_NOTIFICATION_SECTIONS,
    PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS,
    TUTOR_ONLY_PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS
  } from '@cio/utils/notifications';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { memberEmailNotificationsApi } from '$features/settings/api/member-email-notifications.svelte';
  import { orgApi } from '$features/org/api/org.svelte';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Button } from '@cio/ui/base/button';
  import BellIcon from '@lucide/svelte/icons/bell';
  import Building2Icon from '@lucide/svelte/icons/building-2';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  function buildToggleState<T extends string>(keys: readonly T[], source?: Partial<Record<T, boolean>> | null) {
    return Object.fromEntries(keys.map((key) => [key, source?.[key] !== false])) as Record<T, boolean>;
  }

  let personalToggles = $state(buildToggleState(PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS));
  let savedPersonalToggles = $state(buildToggleState(PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS));
  let orgToggles = $state(buildToggleState(EMAIL_NOTIFICATION_TOGGLE_KEYS));
  let isSavingPersonal = $state(false);
  let isSavingOrg = $state(false);
  let isLoadingPersonal = $state(false);
  let hasHydratedOrgToggles = $state(false);

  const tutorOnlyToggleKeys = new Set<string>(TUTOR_ONLY_PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS);

  const personalNotificationSections = $derived(
    $isOrgStudent
      ? PERSONAL_EMAIL_NOTIFICATION_SECTIONS.map((section) => ({
          ...section,
          keys: section.keys.filter((key) => !tutorOnlyToggleKeys.has(key))
        })).filter((section) => section.keys.length > 0)
      : PERSONAL_EMAIL_NOTIFICATION_SECTIONS
  );

  const personalDescription = $derived(
    $currentOrg?.name
      ? t.get('settings.notifications.personal.description_with_org', { orgName: $currentOrg.name })
      : t.get('settings.notifications.personal.description')
  );

  function applyPersonalToggleState(source?: Partial<Record<string, boolean>> | null) {
    const next = buildToggleState(PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS, source);

    for (const key of PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS) {
      personalToggles[key] = next[key];
      savedPersonalToggles[key] = next[key];
    }
  }

  function syncOrgTogglesFromCurrentOrg() {
    const org = get(currentOrg);

    if (!org) return;

    const next = buildToggleState(EMAIL_NOTIFICATION_TOGGLE_KEYS, org.settings?.emailNotifications);

    for (const key of EMAIL_NOTIFICATION_TOGGLE_KEYS) {
      orgToggles[key] = next[key];
    }
  }

  async function loadPersonalPreferences() {
    if (!$currentOrg?.id) return;

    isLoadingPersonal = true;

    const result = await memberEmailNotificationsApi.fetch();

    if (result?.data) {
      applyPersonalToggleState(result.data);
    }

    isLoadingPersonal = false;
  }

  function tryHydrateOrgToggles() {
    if (hasHydratedOrgToggles || !get(isOrgAdmin)) return;

    if (!get(currentOrg)?.id) return;

    syncOrgTogglesFromCurrentOrg();
    hasHydratedOrgToggles = true;
  }

  onMount(() => {
    tryHydrateOrgToggles();
  });

  $effect(() => {
    const orgId = $currentOrg?.id;

    if (!orgId) return;

    void loadPersonalPreferences();
  });

  $effect(() => {
    if (hasHydratedOrgToggles) return;

    const orgId = $isOrgAdmin ? $currentOrg?.id : null;

    if (!orgId) return;

    tryHydrateOrgToggles();
  });

  const personalHasChanges = $derived(
    PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS.some((key) => personalToggles[key] !== savedPersonalToggles[key])
  );

  const orgHasChanges = $derived(
    EMAIL_NOTIFICATION_TOGGLE_KEYS.some(
      (key) => orgToggles[key] !== ($currentOrg?.settings?.emailNotifications?.[key] !== false)
    )
  );

  function toStoredPreferences<T extends string>(keys: readonly T[], toggles: Record<T, boolean>) {
    const preferences: Partial<Record<T, boolean>> = {};

    for (const key of keys) {
      preferences[key] = toggles[key];
    }

    return preferences;
  }

  async function handleSavePersonal() {
    if (!$currentOrg?.id) return;

    isSavingPersonal = true;

    const result = await memberEmailNotificationsApi.update(
      toStoredPreferences(PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS, personalToggles)
    );

    if (memberEmailNotificationsApi.success && result?.data) {
      applyPersonalToggleState(result.data);
      snackbar.success(t.get('settings.notifications.personal.save_success'));
    }

    isSavingPersonal = false;
  }

  async function handleSaveOrg() {
    if (!$currentOrg) return;

    isSavingOrg = true;
    const existingSettings = ($currentOrg.settings as Record<string, unknown>) || {};

    await orgApi.update(
      $currentOrg.id,
      {
        settings: {
          ...existingSettings,
          emailNotifications: toStoredPreferences(EMAIL_NOTIFICATION_TOGGLE_KEYS, orgToggles)
        }
      },
      {
        onSuccess: () => {
          syncOrgTogglesFromCurrentOrg();
          snackbar.success(t.get('settings.notifications.org.save_success'));
        }
      }
    );

    isSavingOrg = false;
  }
</script>

<Field.Group class="w-full max-w-2xl! px-2">
  <Field.Set>
    <Field.Legend class="flex items-center gap-2">
      <BellIcon class="size-5" />
      {$t('settings.notifications.personal.heading')}
    </Field.Legend>
    <Field.Description>
      {personalDescription}
    </Field.Description>

    <div class="mt-4 space-y-6">
      {#each personalNotificationSections as section, sectionIndex (section.id)}
        {#if sectionIndex > 0}
          <Field.Separator />
        {/if}

        <Field.Set>
          <Field.Legend>{$t(`settings.notifications.sections.${section.id}.heading`)}</Field.Legend>
          <Field.Description>
            {$t(`settings.notifications.sections.${section.id}.description`)}
          </Field.Description>

          <div class="mt-4 space-y-4">
            {#each section.keys as key (key)}
              <Field.Field orientation="horizontal">
                <Switch bind:checked={personalToggles[key]} disabled={isSavingPersonal || isLoadingPersonal} />
                <div class="space-y-0.5">
                  <Field.Label>{$t(`settings.notifications.toggles.${key}.label`)}</Field.Label>
                  <Field.Description>
                    {$t(`settings.notifications.toggles.${key}.description`)}
                  </Field.Description>
                </div>
              </Field.Field>
            {/each}
          </div>
        </Field.Set>
      {/each}
    </div>

    <div class="mt-6">
      <Button
        variant="secondary"
        loading={isSavingPersonal}
        disabled={!personalHasChanges || isSavingPersonal || isLoadingPersonal || !$currentOrg?.id}
        onclick={handleSavePersonal}
      >
        {$t('settings.notifications.personal.save')}
      </Button>
    </div>
  </Field.Set>

  {#if $isOrgAdmin}
    <Field.Separator />

    <Field.Set>
      <Field.Legend class="flex items-center gap-2">
        <Building2Icon class="size-5" />
        {$t('settings.notifications.org.heading')}
      </Field.Legend>
      <Field.Description>
        {$t('settings.notifications.org.description')}
      </Field.Description>

      <div class="mt-4 space-y-6">
        {#each ORG_EMAIL_NOTIFICATION_SECTIONS as section, sectionIndex (section.id)}
          {#if sectionIndex > 0}
            <Field.Separator />
          {/if}

          <Field.Set>
            <Field.Legend>{$t(`settings.notifications.sections.${section.id}.heading`)}</Field.Legend>
            <Field.Description>
              {$t(`settings.notifications.sections.${section.id}.description`)}
            </Field.Description>

            <div class="mt-4 space-y-4">
              {#each section.keys as key (key)}
                <Field.Field orientation="horizontal">
                  <Switch bind:checked={orgToggles[key]} disabled={isSavingOrg} />
                  <div class="space-y-0.5">
                    <Field.Label>{$t(`settings.notifications.toggles.${key}.label`)}</Field.Label>
                    <Field.Description>
                      {$t(`settings.notifications.toggles.${key}.description`)}
                    </Field.Description>
                  </div>
                </Field.Field>
              {/each}
            </div>
          </Field.Set>
        {/each}
      </div>

      <div class="mt-6">
        <Button
          variant="secondary"
          loading={isSavingOrg}
          disabled={!orgHasChanges || isSavingOrg}
          onclick={handleSaveOrg}
        >
          {$t('settings.notifications.org.save')}
        </Button>
      </div>
    </Field.Set>
  {/if}
</Field.Group>
