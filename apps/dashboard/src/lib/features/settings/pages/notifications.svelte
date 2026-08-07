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
  import BellIcon from '@lucide/svelte/icons/bell';
  import Building2Icon from '@lucide/svelte/icons/building-2';

  function buildToggleState<T extends string>(keys: readonly T[], source?: Partial<Record<T, boolean>> | null) {
    return Object.fromEntries(keys.map((key) => [key, source?.[key] !== false])) as Record<T, boolean>;
  }

  let personalToggles = $state(buildToggleState(PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS));
  let savedPersonalToggles = $state(buildToggleState(PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS));
  let orgToggles = $state(buildToggleState(EMAIL_NOTIFICATION_TOGGLE_KEYS));
  let savedOrgToggles = $state(buildToggleState(EMAIL_NOTIFICATION_TOGGLE_KEYS));
  let isSavingPersonal = $state(false);
  let isSavingOrg = $state(false);
  let isLoadingPersonal = $state(false);
  let personalLoadVersion = 0;
  let lastHydratedOrgId: string | null = null;

  interface Props {
    hasUnsavedChanges?: boolean;
  }

  let { hasUnsavedChanges = $bindable(false) }: Props = $props();

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

  function applyOrgToggleState(source?: Partial<Record<string, boolean>> | null) {
    const next = buildToggleState(EMAIL_NOTIFICATION_TOGGLE_KEYS, source);

    for (const key of EMAIL_NOTIFICATION_TOGGLE_KEYS) {
      orgToggles[key] = next[key];
      savedOrgToggles[key] = next[key];
    }
  }

  async function loadPersonalPreferences() {
    const loadVersion = ++personalLoadVersion;

    isLoadingPersonal = true;

    const result = await memberEmailNotificationsApi.fetch();

    // A newer load or a save started while this request was in flight — it owns the state now.
    if (loadVersion !== personalLoadVersion) return;

    if (result?.data) {
      applyPersonalToggleState(result.data);
    }

    isLoadingPersonal = false;
  }

  $effect(() => {
    const orgId = $currentOrg?.id;

    if (!orgId) return;

    void loadPersonalPreferences();
  });

  // Org defaults hydrate once per organization. `/account` returns `settings`
  // together with the org id and role, so an id transition never misses
  // late-arriving settings — and unsaved edits from another org are discarded
  // instead of being saved against the wrong organization.
  $effect(() => {
    const orgId = $isOrgAdmin ? $currentOrg?.id : null;

    if (!orgId || orgId === lastHydratedOrgId) return;

    lastHydratedOrgId = orgId;
    applyOrgToggleState($currentOrg?.settings?.emailNotifications);
  });

  const personalHasChanges = $derived(
    PERSONAL_EMAIL_NOTIFICATION_TOGGLE_KEYS.some((key) => personalToggles[key] !== savedPersonalToggles[key])
  );

  const orgHasChanges = $derived(
    EMAIL_NOTIFICATION_TOGGLE_KEYS.some((key) => orgToggles[key] !== savedOrgToggles[key])
  );

  $effect(() => {
    hasUnsavedChanges = personalHasChanges || orgHasChanges;
  });

  export async function handleSaveAll() {
    if (personalHasChanges) {
      await handleSavePersonal();
    }

    if (orgHasChanges) {
      await handleSaveOrg();
    }
  }

  export function handleDiscard() {
    applyPersonalToggleState(savedPersonalToggles);

    for (const key of EMAIL_NOTIFICATION_TOGGLE_KEYS) {
      orgToggles[key] = savedOrgToggles[key];
    }

    hasUnsavedChanges = false;
  }

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
    personalLoadVersion++;

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
    const emailNotifications = toStoredPreferences(EMAIL_NOTIFICATION_TOGGLE_KEYS, orgToggles);

    // The API deep-merges `settings`, so only send the key being changed —
    // spreading local settings here could write stale values over other keys.
    await orgApi.update(
      $currentOrg.id,
      {
        settings: { emailNotifications }
      },
      {
        onSuccess: () => {
          currentOrg.update((org) => ({
            ...org,
            settings: {
              ...(org.settings as Record<string, unknown> | undefined),
              emailNotifications
            }
          }));
          applyOrgToggleState(emailNotifications);
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
    </Field.Set>
  {/if}
</Field.Group>
