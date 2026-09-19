import { describe, expect, it, vi } from 'vitest';
import { defineActivityType, definePlugin, resolveConfig, defineConfig } from '@cio/sdk';

const MockEditComponent = vi.fn();
const MockTakeComponent = vi.fn();
const MockReviewComponent = vi.fn();
const loadEditComponent = vi.fn(async () => ({ default: MockEditComponent as any }));
const loadTakeComponent = vi.fn(async () => ({ default: MockTakeComponent as any }));
const loadReviewComponent = vi.fn(async () => ({ default: MockReviewComponent as any }));

describe('defineActivityType — factory & contract validation', () => {
  it('creates an activity type definition with key, label, renderers, and optional evaluation hooks', () => {
    const activity = defineActivityType({
      key: 'flashcards',
      label: 'Interactive Flashcards',
      renderers: {
        edit: loadEditComponent,
        take: loadTakeComponent,
        review: loadReviewComponent
      },
      isCompleted: (state: { cardsReviewed: number; totalCards: number }) => {
        return state.cardsReviewed >= state.totalCards;
      },
      calculateGrade: (state: { correctCount: number; totalCards: number }) => {
        return Math.round((state.correctCount / state.totalCards) * 100);
      }
    });

    expect(activity.key).toBe('flashcards');
    expect(activity.label).toBe('Interactive Flashcards');
    expect(activity.renderers.edit).toBe(loadEditComponent);
    expect(activity.renderers.take).toBe(loadTakeComponent);
    expect(activity.renderers.review).toBe(loadReviewComponent);
    expect(typeof activity.isCompleted).toBe('function');
    expect(typeof activity.calculateGrade).toBe('function');
  });

  it('throws if required fields (key, label, renderers) are missing', () => {
    expect(() => {
      // @ts-expect-error missing renderers
      defineActivityType({
        key: 'missing_renderers',
        label: 'Missing Renderers'
      });
    }).toThrow(/renderers/i);

    expect(() => {
      // @ts-expect-error missing key
      defineActivityType({
        label: 'Missing Key',
        renderers: {
          edit: loadEditComponent,
          take: loadTakeComponent,
          review: loadReviewComponent
        }
      });
    }).toThrow(/key/i);

    expect(() => {
      // @ts-expect-error missing edit renderer
      defineActivityType({
        key: 'missing_edit',
        label: 'Missing Edit',
        renderers: {
          take: loadTakeComponent,
          review: loadReviewComponent
        }
      });
    }).toThrow(/renderers\.edit/i);
  });

  it('correctly executes isCompleted logic', () => {
    const activity = defineActivityType({
      key: 'scenarios',
      label: 'Branching Scenarios',
      renderers: {
        edit: loadEditComponent,
        take: loadTakeComponent,
        review: loadReviewComponent
      },
      isCompleted: (state: { step: number; totalSteps: number }) => state.step >= state.totalSteps
    });

    expect(activity.isCompleted?.({ step: 2, totalSteps: 5 })).toBe(false);
    expect(activity.isCompleted?.({ step: 5, totalSteps: 5 })).toBe(true);
    expect(activity.isCompleted?.({ step: 6, totalSteps: 5 })).toBe(true);
  });

  it('correctly executes calculateGrade logic', () => {
    const activity = defineActivityType({
      key: 'quiz_activity',
      label: 'Activity Quiz',
      renderers: {
        edit: loadEditComponent,
        take: loadTakeComponent,
        review: loadReviewComponent
      },
      calculateGrade: (state: { score: number; maxScore: number }) => (state.score / state.maxScore) * 100
    });

    expect(activity.calculateGrade?.({ score: 8, maxScore: 10 })).toBe(80);
    expect(activity.calculateGrade?.({ score: 10, maxScore: 10 })).toBe(100);
  });
});

describe('defineActivityType — plugin & resolveConfig aggregation', () => {
  it('registers activity types in definePlugin and aggregates in resolveConfig', () => {
    const flashcardActivity = defineActivityType({
      key: 'flashcards',
      label: 'Flashcards',
      renderers: {
        edit: loadEditComponent,
        take: loadTakeComponent,
        review: loadReviewComponent
      }
    });

    const scenarioActivity = defineActivityType({
      key: 'scenarios',
      label: 'Scenarios',
      renderers: {
        edit: loadEditComponent,
        take: loadTakeComponent,
        review: loadReviewComponent
      }
    });

    const pluginA = definePlugin({
      id: 'activity_flashcards',
      name: 'Flashcards Plugin',
      version: '1.0.0',
      category: 'activity',
      description: 'Flashcard activity',
      activities: [flashcardActivity]
    });

    const pluginB = definePlugin({
      id: 'activity_scenarios',
      name: 'Scenarios Plugin',
      version: '1.0.0',
      category: 'activity',
      description: 'Branching scenario activity',
      activities: [scenarioActivity]
    });

    const resolved = resolveConfig(
      defineConfig({
        plugins: [pluginA, pluginB]
      })
    );

    expect(resolved.activities).toBeDefined();
    expect(resolved.activities['flashcards']).toBeDefined();
    expect(resolved.activities['flashcards'].label).toBe('Flashcards');
    expect(resolved.activities['scenarios']).toBeDefined();
    expect(resolved.activities['scenarios'].label).toBe('Scenarios');
  });

  it('throws on duplicate activity key collision between plugins', () => {
    const act1 = defineActivityType({
      key: 'duplicate_key',
      label: 'Act 1',
      renderers: { edit: loadEditComponent, take: loadTakeComponent, review: loadReviewComponent }
    });

    const act2 = defineActivityType({
      key: 'duplicate_key',
      label: 'Act 2',
      renderers: { edit: loadEditComponent, take: loadTakeComponent, review: loadReviewComponent }
    });

    const pluginA = definePlugin({
      id: 'activity_dup_one',
      name: 'Duplicate Plugin 1',
      version: '1.0.0',
      category: 'activity',
      description: 'Duplicate 1',
      activities: [act1]
    });

    const pluginB = definePlugin({
      id: 'activity_dup_two',
      name: 'Duplicate Plugin 2',
      version: '1.0.0',
      category: 'activity',
      description: 'Duplicate 2',
      activities: [act2]
    });

    expect(() => {
      resolveConfig(
        defineConfig({
          plugins: [pluginA, pluginB]
        })
      );
    }).toThrow(/duplicate_key/i);
  });
});
