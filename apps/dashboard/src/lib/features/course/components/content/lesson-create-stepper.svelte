<script lang="ts">
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import { lessonApi, courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import type { StepperState, StepperActions, BaseStepperProps } from './types';
  import { LESSON_STEPPER_DEFAULT_STATE, ADD_CONTENT_CREATE_LESSON_KEY } from './constants';

  interface Props extends BaseStepperProps {
    stepperState: StepperState;
  }

  let {
    courseId,
    sectionId,
    order,
    canCreate,
    onCreated,
    stepperState = $bindable(LESSON_STEPPER_DEFAULT_STATE)
  }: Props = $props();

  // ============================================
  // INTERNAL STATE
  // ============================================
  let title = $state('');
  let isSubmitting = $state(false);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const canProceed = $derived(title.trim().length > 0 && canCreate);

  // ============================================
  // SYNC STATE TO BINDABLE (parent has bind:stepperState)
  // Only assign when values change to avoid infinite re-renders.
  // ============================================
  $effect(() => {
    const nextCanProceed = canProceed;
    const nextIsSubmitting = isSubmitting;
    const nextPrimaryActionLabel = $t(ADD_CONTENT_CREATE_LESSON_KEY);
    if (
      stepperState.canProceed !== nextCanProceed ||
      stepperState.isSubmitting !== nextIsSubmitting ||
      stepperState.primaryActionLabel !== nextPrimaryActionLabel
    ) {
      stepperState = {
        ...LESSON_STEPPER_DEFAULT_STATE,
        canProceed: nextCanProceed,
        isSubmitting: nextIsSubmitting,
        primaryActionLabel: nextPrimaryActionLabel
      };
    }
  });

  // ============================================
  // EXPORTED ACTIONS
  // ============================================
  export const actions: StepperActions = {
    async next() {
      if (!canProceed || isSubmitting) return;

      isSubmitting = true;
      try {
        await lessonApi.create(courseId, {
          title: title.trim(),
          courseId,
          lessonAt: new Date().toDateString(),
          isUnlocked: true,
          order,
          sectionId
        });

        if (lessonApi.success && lessonApi.lesson) {
          // Refresh course content
          const profileId = $profile?.id;
          if (profileId) {
            await courseApi.refreshCourse(courseId, profileId);
          }
          onCreated(lessonApi.lesson.id);
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
      stepperState = { ...LESSON_STEPPER_DEFAULT_STATE };
    }
  };
</script>

<!-- Form content only, NO buttons -->
<div>
  <InputField
    label={$t('course.navItem.lessons.add_lesson.lesson_title')}
    bind:value={title}
    autoFocus={true}
    className="w-2/4!"
    isRequired={true}
    placeholder={$t('course.navItem.lessons.add_content_lesson_title_placeholder')}
  />
</div>
