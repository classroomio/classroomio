import { PROCESS_MAX_STEPS, PROCESS_MIN_STEPS, type TProcessBlockData } from '@cio/utils/validation/block';

export interface ProcessStepCopy {
  heading: string;
  body: string;
}

export function createStepId(): string {
  return crypto.randomUUID();
}

/**
 * The walkthrough a menu click inserts, one step per example.
 */
export function createExampleProcess(copy: ProcessStepCopy[]): TProcessBlockData {
  const steps = copy.map((example) => ({ id: createStepId(), heading: example.heading, body: example.body }));

  return { steps };
}

export function setStepHeading(data: TProcessBlockData, stepId: string, heading: string): TProcessBlockData {
  const steps = data.steps.map((step) => (step.id === stepId ? { ...step, heading } : step));

  return { ...data, steps };
}

export function setStepBody(data: TProcessBlockData, stepId: string, body: string): TProcessBlockData {
  const steps = data.steps.map((step) => (step.id === stepId ? { ...step, body } : step));

  return { ...data, steps };
}

/**
 * Sets or clears one step's image.
 */
export function setStepImage(data: TProcessBlockData, stepId: string, imageUrl: string | null): TProcessBlockData {
  const steps = data.steps.map((step) => {
    if (step.id !== stepId) return step;

    const { imageUrl: _previous, ...rest } = step;

    return imageUrl ? { ...rest, imageUrl } : rest;
  });

  return { ...data, steps };
}

/**
 * Appends a step. The process is returned unchanged once it holds the maximum.
 */
export function addStep(data: TProcessBlockData, copy: ProcessStepCopy): TProcessBlockData {
  if (data.steps.length >= PROCESS_MAX_STEPS) return data;

  const step = { id: createStepId(), heading: copy.heading, body: copy.body };

  return { ...data, steps: [...data.steps, step] };
}

/**
 * Removes one step. The process is returned unchanged when it is already at the minimum.
 */
export function removeStep(data: TProcessBlockData, stepId: string): TProcessBlockData {
  if (data.steps.length <= PROCESS_MIN_STEPS) return data;

  const steps = data.steps.filter((step) => step.id !== stepId);

  return { ...data, steps };
}
