import type { ProcessBlockLabels } from '@cio/ui/custom/block';
import { t } from '$lib/utils/functions/translations';
import type { ProcessStepCopy } from './process-utils';

const KEY = 'course.navItem.lessons.materials.blocks.process';

export function getProcessLabels(): ProcessBlockLabels {
  return {
    stepper: t.get(`${KEY}.stepper`),
    goToStep: (step) => t.get(`${KEY}.go_to_step`, { step }),
    untitledStep: t.get(`${KEY}.untitled_step`),
    headingPlaceholder: t.get(`${KEY}.heading_placeholder`),
    bodyPlaceholder: t.get(`${KEY}.body_placeholder`),
    addMedia: t.get(`${KEY}.add_media`),
    imageOption: t.get(`${KEY}.image_option`),
    removeImage: t.get(`${KEY}.remove_image`),
    deleteStep: t.get(`${KEY}.delete_step`),
    addStep: t.get(`${KEY}.add_step`),
    back: t.get(`${KEY}.back`),
    next: t.get(`${KEY}.next`),
    startOver: t.get(`${KEY}.start_over`),
    progress: t.get(`${KEY}.progress`)
  };
}

export function getNewStepCopy(): ProcessStepCopy {
  return { heading: t.get(`${KEY}.new_step_heading`), body: t.get(`${KEY}.new_step_body`) };
}

export function getProcessExampleCopy(): ProcessStepCopy[] {
  return [1, 2, 3].map((number) => ({
    heading: t.get(`${KEY}.example.heading_${number}`),
    body: t.get(`${KEY}.example.body_${number}`)
  }));
}
