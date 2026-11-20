import { describe, expect, it } from 'vitest';
import { PROCESS_MAX_STEPS, ZProcessBlockData } from '@cio/utils/validation/block';
import { addStep, createExampleProcess, removeStep, setStepBody, setStepHeading, setStepImage } from './process-utils';

const EXAMPLES = [
  { heading: 'Introduction', body: 'Start here.' },
  { heading: 'How it works', body: 'Then this.' }
];
const NEW_STEP = { heading: 'New step', body: 'Describe this step.' };

describe('process utils', () => {
  it('creates a valid example process with one step per example', () => {
    const process = createExampleProcess(EXAMPLES);

    expect(process.steps.map((step) => step.heading)).toEqual(['Introduction', 'How it works']);
    expect(ZProcessBlockData.safeParse(process).success).toBe(true);
  });

  it('edits only the targeted step', () => {
    const process = createExampleProcess(EXAMPLES);
    const [first, second] = process.steps;
    const edited = setStepBody(setStepHeading(process, first.id, 'Welcome'), first.id, 'Read this first.');

    expect(edited.steps[0]).toEqual({ id: first.id, heading: 'Welcome', body: 'Read this first.' });
    expect(edited.steps[1]).toEqual(second);
  });

  it('sets and clears a step image without leaving an empty field', () => {
    const process = createExampleProcess(EXAMPLES);
    const stepId = process.steps[0].id;
    const withImage = setStepImage(process, stepId, 'https://example.com/a.png');

    expect(withImage.steps[0].imageUrl).toBe('https://example.com/a.png');
    expect('imageUrl' in setStepImage(withImage, stepId, null).steps[0]).toBe(false);
  });

  it('adds a step and stops at the maximum', () => {
    const process = addStep(createExampleProcess(EXAMPLES), NEW_STEP);

    expect(process.steps[process.steps.length - 1]).toMatchObject(NEW_STEP);

    let full = process;
    while (full.steps.length < PROCESS_MAX_STEPS) full = addStep(full, NEW_STEP);

    expect(addStep(full, NEW_STEP)).toBe(full);
  });

  it('removes a step but never the last one', () => {
    const process = createExampleProcess(EXAMPLES);
    const single = removeStep(process, process.steps[0].id);

    expect(single.steps.map((step) => step.heading)).toEqual(['How it works']);
    expect(removeStep(single, single.steps[0].id)).toBe(single);
  });
});
