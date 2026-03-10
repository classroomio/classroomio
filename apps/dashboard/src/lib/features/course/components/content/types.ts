/**
 * State exposed by stepper components to the parent modal.
 * This enables the modal to render unified navigation buttons.
 */
export interface StepperState {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps in this stepper */
  totalSteps: number;
  /** Whether the user can proceed to next step (validation passed) */
  canProceed: boolean;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Label for the primary action button (e.g., "Next", "Create", "Finish") */
  primaryActionLabel: string;
}

/**
 * Callbacks that the modal can invoke to control the stepper.
 */
export interface StepperActions {
  /** Move to the next step. If on last step, this triggers submission. */
  next: () => void | Promise<void>;
  /** Move to the previous step */
  back: () => void;
  /** Reset the stepper to initial state */
  reset: () => void;
}

/**
 * Combined type for component references.
 * Use this when binding to stepper components with bind:this.
 * State is passed via bind:stepperState; ref is used for actions only.
 */
export interface StepperRef {
  actions: StepperActions;
}

/**
 * Props interface that all stepper components should accept.
 */
export interface BaseStepperProps {
  /** Course ID for API calls */
  courseId: string;
  /** Optional section ID when adding content to a specific section */
  sectionId?: string;
  /** Order/position for the new content */
  order?: number;
  /** Whether the user has permission to create content */
  canCreate: boolean;
  /** Callback when content is successfully created */
  onCreated: (id: string) => void;
}
