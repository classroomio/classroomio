<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { PROCESS_BODY_MAX_LENGTH, PROCESS_HEADING_MAX_LENGTH, PROCESS_MAX_STEPS } from '@cio/utils/validation/block';
  import type { BlockEditProps } from '../../utils/types';
  import { getNewStepCopy, getProcessLabels } from './process-labels';
  import { addStep, removeStep, setStepBody, setStepHeading, setStepImage } from './process-utils';

  let { block, onDataChange, onRequestImage }: BlockEditProps<'process'> = $props();

  async function addImage(stepId: string) {
    const imageUrl = await onRequestImage();
    if (!imageUrl) return;

    onDataChange(setStepImage(block.data, stepId, imageUrl));
  }
</script>

<Block.Process
  editable
  steps={block.data.steps}
  maxSteps={PROCESS_MAX_STEPS}
  headingMaxLength={PROCESS_HEADING_MAX_LENGTH}
  bodyMaxLength={PROCESS_BODY_MAX_LENGTH}
  labels={getProcessLabels()}
  testId="block-process-edit"
  onHeadingInput={(stepId, heading) => onDataChange(setStepHeading(block.data, stepId, heading))}
  onBodyInput={(stepId, body) => onDataChange(setStepBody(block.data, stepId, body))}
  onAddStep={() => onDataChange(addStep(block.data, getNewStepCopy()))}
  onRemoveStep={(stepId) => onDataChange(removeStep(block.data, stepId))}
  onAddImage={addImage}
  onRemoveImage={(stepId) => onDataChange(setStepImage(block.data, stepId, null))}
/>
