import { describe, expect, it } from 'vitest';
import {
  QUESTION_TYPE_KEY,
  getRendererDefinition,
  getRendererForMode,
  type ExerciseRendererDefinition,
  type ExerciseRendererRegistry
} from '../src';

type Renderer = string;

const FALLBACK_RENDERER: ExerciseRendererDefinition<Renderer> = {
  edit: 'fallback-edit',
  take: 'fallback-take',
  preview: 'fallback-preview'
};

const REGISTRY: ExerciseRendererRegistry<Renderer> = {
  [QUESTION_TYPE_KEY.RADIO]: {
    edit: 'radio-edit',
    take: 'radio-take',
    preview: 'radio-preview'
  },
  [QUESTION_TYPE_KEY.ORDERING]: {
    edit: 'ordering-edit',
    take: 'ordering-take',
    preview: 'ordering-preview'
  }
};

describe('renderer registry helpers', () => {
  it('returns the registered renderer definition when available', () => {
    expect(getRendererDefinition(REGISTRY, QUESTION_TYPE_KEY.RADIO, FALLBACK_RENDERER)).toEqual(
      REGISTRY[QUESTION_TYPE_KEY.RADIO]
    );
  });

  it('returns fallback definition for an unregistered question type', () => {
    expect(getRendererDefinition(REGISTRY, QUESTION_TYPE_KEY.LINK, FALLBACK_RENDERER)).toEqual(FALLBACK_RENDERER);
  });

  it('returns renderer by mode for registered types', () => {
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.RADIO, 'edit', FALLBACK_RENDERER)).toBe('radio-edit');
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.RADIO, 'take', FALLBACK_RENDERER)).toBe('radio-take');
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.RADIO, 'preview', FALLBACK_RENDERER)).toBe('radio-preview');
  });

  it("resolves 'view' mode to the 'take' renderer", () => {
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.ORDERING, 'view', FALLBACK_RENDERER)).toBe('ordering-take');
  });

  it('returns fallback renderer mode when type is unregistered', () => {
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.LINK, 'edit', FALLBACK_RENDERER)).toBe('fallback-edit');
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.LINK, 'take', FALLBACK_RENDERER)).toBe('fallback-take');
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.LINK, 'preview', FALLBACK_RENDERER)).toBe('fallback-preview');
    expect(getRendererForMode(REGISTRY, QUESTION_TYPE_KEY.LINK, 'view', FALLBACK_RENDERER)).toBe('fallback-take');
  });
});
