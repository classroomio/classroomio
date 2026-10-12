<script lang="ts">
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { courseApi, activityApi } from '$features/course/api';
  import { licenseApi } from '$features/license/api/license.svelte';
  import { profile } from '$lib/utils/store/user';
  import { ContentType } from '@cio/utils/constants/content';
  import type { StepperState, StepperActions, BaseStepperProps } from './types';
  import { ACTIVITY_STEPPER_DEFAULT_STATE, ADD_CONTENT_CREATE_KEY } from './constants';

  interface Props extends BaseStepperProps {
    stepperState: StepperState;
  }

  let {
    courseId,
    sectionId,
    order,
    canCreate,
    onCreated,
    session,
    stepperState = $bindable(ACTIVITY_STEPPER_DEFAULT_STATE)
  }: Props = $props();

  let title = $state('');
  let isSubmitting = $state(false);

  const hasScormAccess = $derived(licenseApi.hasAccess('scorm'));
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const canProceed = $derived(title.trim().length > 0 && canCreate && hasScormAccess);

  $effect(() => {
    const nextCanProceed = canProceed;
    const nextIsSubmitting = isSubmitting;
    const nextPrimaryActionLabel = $t(ADD_CONTENT_CREATE_KEY);
    if (
      stepperState.canProceed !== nextCanProceed ||
      stepperState.isSubmitting !== nextIsSubmitting ||
      stepperState.primaryActionLabel !== nextPrimaryActionLabel
    ) {
      stepperState = {
        ...ACTIVITY_STEPPER_DEFAULT_STATE,
        canProceed: nextCanProceed,
        isSubmitting: nextIsSubmitting,
        primaryActionLabel: nextPrimaryActionLabel
      };
    }
  });

  export const actions: StepperActions = {
    async next() {
      if (!canProceed || isSubmitting) return;

      const startedSession = session;
      isSubmitting = true;
      try {
        const trimmedTitle = title.trim();
        const createdActivity = await activityApi.create(courseId, {
          kind: 'scorm',
          sectionId,
          title: trimmedTitle
        });

        if (createdActivity) {
          const profileId = $profile?.id;
          if (profileId) {
            void courseApi.refreshCourse(courseId, profileId).catch((refreshError) => {
              console.error('Failed to refresh course after activity create:', refreshError);
            });
          }

          onCreated(
            {
              id: createdActivity.id,
              title: createdActivity.title ?? trimmedTitle,
              type: ContentType.Activity,
              order: createdActivity.order ?? order
            },
            startedSession
          );
        }
      } finally {
        isSubmitting = false;
      }
    },

    back() {
      // Single step - nothing to go back to within stepper
    },

    reset() {
      title = '';
      isSubmitting = false;
      stepperState = { ...ACTIVITY_STEPPER_DEFAULT_STATE };
    }
  };
</script>

{#if !hasScormAccess}
  <div class="flex flex-col gap-3">
    <Badge variant="secondary">{$t('course.navItem.lessons.add_content_options.activity_scorm_gated')}</Badge>
    <p class="ui:text-muted-foreground text-sm">
      {#if isSelfHosted}
        {$t('course.navItem.lessons.add_content_options.activity_scorm_license_notice')}
      {:else}
        {$t('course.navItem.lessons.add_content_options.activity_scorm_upgrade_notice')}
      {/if}
    </p>
    {#if !isSelfHosted}
      <Button variant="outline" onclick={openUpgradeModal}>
        {$t('course.navItem.lessons.add_content_options.activity_scorm_upgrade_cta')}
      </Button>
    {/if}
  </div>
{:else}
  <InputField
    label={$t('course.navItem.lessons.add_content_options.activity_scorm_title_label')}
    bind:value={title}
    autoFocus={true}
    className="w-full"
    isRequired={true}
    placeholder={$t('course.navItem.lessons.add_content_options.activity_scorm_title_placeholder')}
  />
{/if}
