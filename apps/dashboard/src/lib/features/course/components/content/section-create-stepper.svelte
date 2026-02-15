<script lang="ts">
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import { lessonApi, courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import type { StepperState, StepperActions, BaseStepperProps } from './types';
  import { SECTION_STEPPER_DEFAULT_STATE, ADD_CONTENT_CREATE_SECTION_KEY } from './constants';

  interface Props extends Omit<BaseStepperProps, 'sectionId'> {
    sections: Array<{ id: string; order?: number }>;
    stepperState: StepperState;
  }

  let {
    courseId,
    order,
    canCreate,
    onCreated,
    sections,
    stepperState = $bindable(SECTION_STEPPER_DEFAULT_STATE)
  }: Props = $props();

  // ============================================
  // INTERNAL STATE
  // ============================================
  let title = $state('');
  let isSubmitting = $state(false);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Can the user proceed? Title must not be empty and user must have permission
  const canProceed = $derived(title.trim().length > 0 && canCreate);

  // ============================================
  // SYNC STATE TO BINDABLE (parent has bind:stepperState)
  // Only assign when values change to avoid infinite re-renders.
  // ============================================
  $effect(() => {
    const nextCanProceed = canProceed;
    const nextIsSubmitting = isSubmitting;
    const nextPrimaryActionLabel = $t(ADD_CONTENT_CREATE_SECTION_KEY);
    if (
      stepperState.canProceed !== nextCanProceed ||
      stepperState.isSubmitting !== nextIsSubmitting ||
      stepperState.primaryActionLabel !== nextPrimaryActionLabel
    ) {
      stepperState = {
        ...SECTION_STEPPER_DEFAULT_STATE,
        canProceed: nextCanProceed,
        isSubmitting: nextIsSubmitting,
        primaryActionLabel: nextPrimaryActionLabel
      };
    }
  });

  // ============================================
  // EXPORTED ACTIONS (for parent modal to call)
  // ============================================

  export const actions: StepperActions = {
    // Called when user clicks the primary button
    async next() {
      if (!canProceed || isSubmitting) return;

      isSubmitting = true;
      try {
        // Calculate order if not provided
        const finalOrder = order ?? getNextOrder();

        await lessonApi.createSection(courseId, {
          title: title.trim(),
          courseId,
          order: finalOrder
        });

        if (lessonApi.success) {
          // Refresh course content so sidebar updates
          const profileId = $profile?.id;
          if (profileId) {
            await courseApi.refreshCourse(courseId, profileId);
          }
          // Notify parent that creation succeeded (section ID not needed for modal close)
          onCreated('');
        }
      } finally {
        isSubmitting = false;
      }
    },

    // Called when user clicks back (not applicable for 1-step)
    back() {
      // Single step stepper - nothing to go back to within this component
      // The modal will handle going back to type selection
    },

    // Called when modal opens to reset state
    reset() {
      title = '';
      isSubmitting = false;
      stepperState = { ...SECTION_STEPPER_DEFAULT_STATE };
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  function getNextOrder(): number {
    const orders = sections.map((s, i) => s.order ?? i + 1);
    return orders.length ? Math.max(...orders) + 1 : 1;
  }
</script>

<!--
  IMPORTANT: This component renders ONLY the form content.
  NO buttons here - the parent modal handles all navigation buttons.
-->
<InputField
  label={$t('course.navItem.lessons.add_lesson.course_section_title')}
  bind:value={title}
  autoFocus={true}
  className="w-full"
  isRequired={true}
  placeholder={$t('course.navItem.lessons.add_content_section_title_placeholder')}
/>
