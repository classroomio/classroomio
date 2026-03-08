<script lang="ts">
  import { currentOrg, isEnterprisePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { orgApi } from '$features/org/api/org.svelte';
  import * as Alert from '@cio/ui/base/alert';

  // Auth settings state - synced with store
  let disableSignup = $state($currentOrg?.disableSignup ?? false);
  let disableSignupMessage = $state($currentOrg?.disableSignupMessage ?? '');
  let allowPublicSignups = $state(!$currentOrg?.settings?.signup?.inviteOnly);
  let disableEmailPassword = $state($currentOrg?.disableEmailPassword ?? false);
  let disableGoogleAuth = $state($currentOrg?.disableGoogleAuth ?? false);
  let isSaving = $state(false);

  // Sync with store when it changes
  $effect(() => {
    if ($currentOrg) {
      disableSignup = $currentOrg.disableSignup ?? false;
      disableSignupMessage = $currentOrg.disableSignupMessage ?? '';
      allowPublicSignups = !$currentOrg.settings?.signup?.inviteOnly;
      disableEmailPassword = $currentOrg.disableEmailPassword ?? false;
      disableGoogleAuth = $currentOrg.disableGoogleAuth ?? false;
    }
  });

  async function handleSave() {
    if (!$currentOrg) return;

    isSaving = true;
    await orgApi.update(
      $currentOrg.id,
      {
        disableSignup,
        disableSignupMessage,
        settings: { signup: { inviteOnly: !allowPublicSignups } },
        disableEmailPassword,
        disableGoogleAuth
      },
      {
        onSuccess: () => {
          snackbar.success(t.get('snackbar.success_update'));
        }
      }
    );
    isSaving = false;
  }

  let currentAllowPublicSignups = $derived(!$currentOrg?.settings?.signup?.inviteOnly);
  let hasChanges = $derived(
    disableSignup !== ($currentOrg?.disableSignup ?? false) ||
      disableSignupMessage !== ($currentOrg?.disableSignupMessage ?? '') ||
      allowPublicSignups !== currentAllowPublicSignups ||
      disableEmailPassword !== ($currentOrg?.disableEmailPassword ?? false) ||
      disableGoogleAuth !== ($currentOrg?.disableGoogleAuth ?? false)
  );
</script>

<Field.Group class="w-full max-w-2xl! px-2">
  <Field.Set>
    <Field.Legend class="flex items-center gap-2">
      <LockIcon class="size-5" />
      {$t('settings.auth.general.heading')}
    </Field.Legend>
    <Field.Description>
      {$t('settings.auth.general.description')}
    </Field.Description>

    <div class="mt-4 space-y-4">
      <!-- Disable Signup -->
      <Field.Field orientation="horizontal">
        <Switch bind:checked={disableSignup} disabled={!$isEnterprisePlan || isSaving} />
        <div class="space-y-0.5">
          <Field.Label>{$t('settings.auth.general.disable_signup.label')}</Field.Label>
          <Field.Description>
            {$t('settings.auth.general.disable_signup.description')}
          </Field.Description>
        </div>
      </Field.Field>

      <!-- Allow Public Signups (invite-only when off) -->
      <Field.Field orientation="horizontal">
        <Switch bind:checked={allowPublicSignups} disabled={!$isEnterprisePlan || isSaving} />
        <div class="space-y-0.5">
          <Field.Label>{$t('settings.auth.general.allow_public_signups.label')}</Field.Label>
          <Field.Description>
            {$t('settings.auth.general.allow_public_signups.description')}
          </Field.Description>
        </div>
      </Field.Field>

      <!-- Signup Disabled Message (shown when disableSignup is true) -->
      {#if disableSignup}
        <Field.Field>
          <Field.Label>{$t('settings.auth.general.disable_signup_message.label')}</Field.Label>
          <Field.Description>
            {$t('settings.auth.general.disable_signup_message.description')}
          </Field.Description>
          <Textarea
            bind:value={disableSignupMessage}
            placeholder={$t('settings.auth.general.disable_signup_message.placeholder')}
            class="mt-2 w-full"
            disabled={!$isEnterprisePlan || isSaving}
            rows={3}
          />
        </Field.Field>
      {/if}

      <!-- Disable Email/Password Login -->
      <Field.Field orientation="horizontal">
        <Switch bind:checked={disableEmailPassword} disabled={!$isEnterprisePlan || isSaving} />
        <div class="space-y-0.5">
          <Field.Label>{$t('settings.auth.general.disable_email_password.label')}</Field.Label>
          <Field.Description>
            {$t('settings.auth.general.disable_email_password.description')}
          </Field.Description>
        </div>
      </Field.Field>

      <!-- Disable Google Auth -->
      <Field.Field orientation="horizontal">
        <Switch bind:checked={disableGoogleAuth} disabled={!$isEnterprisePlan || isSaving} />
        <div class="space-y-0.5">
          <Field.Label>{$t('settings.auth.general.disable_google_auth.label')}</Field.Label>
          <Field.Description>
            {$t('settings.auth.general.disable_google_auth.description')}
          </Field.Description>
        </div>
      </Field.Field>
    </div>

    {#if hasChanges}
      <div class="mt-6 flex justify-end">
        <Button variant="default" onclick={handleSave} loading={isSaving} disabled={isSaving || !$isEnterprisePlan}>
          {$t('settings.auth.general.save_button')}
        </Button>
      </div>
    {/if}
  </Field.Set>

  <Field.Separator />

  <!-- Info Box -->
  <Alert.Callout
    variant="information"
    title={$t('settings.auth.general.note_title')}
    description={$t('settings.auth.general.note_description')}
    class="w-full"
  />
</Field.Group>
