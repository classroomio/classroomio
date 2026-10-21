import { describe, expect, it } from 'vitest';

import {
  beginAccept,
  buildAcceptPayload,
  createPersonalLearningState,
  dismissOffer,
  isSourceRetryableFailure,
  receiveAnswer,
  submitQuestion,
  selectDailyMinutes,
  selectStudyDays,
  visibleSessionIndexes
} from './personal-learning-state';

describe('personal learning state', () => {
  it('shows the optional offer only after the answer and exposes all supported choices', () => {
    const initialState = createPersonalLearningState();
    const pendingState = submitQuestion(initialState, 'Explain derivatives.');
    const answeredState = receiveAnswer(pendingState, {
      answer: 'A derivative measures an instantaneous rate of change.',
      offer: { id: 'offer-1', suggestedStudyDays: 7, reason: 'Practice the basics over a week.' }
    });

    expect(initialState.offer).toBeNull();
    expect(answeredState.messages.map(({ role }) => role)).toEqual(['user', 'assistant']);
    expect(answeredState.isAnswering).toBe(false);
    expect(answeredState.offer?.choices).toEqual([1, 7, 30]);
  });

  it('does not send a second question while an answer is pending', () => {
    const pendingState = submitQuestion(createPersonalLearningState(), 'Explain derivatives.');

    expect(submitQuestion(pendingState, 'What is a limit?')).toBe(pendingState);
    expect(pendingState.messages).toHaveLength(1);
  });

  it('allows changing day and daily-minute choices before an explicit consent', () => {
    const stateWithOffer = receiveAnswer(createPersonalLearningState(), {
      answer: 'Start with the core concepts.',
      offer: { id: 'offer-2', suggestedStudyDays: 1, reason: 'A compact introduction fits one day.' }
    });
    const selectedDays = selectStudyDays(stateWithOffer, 30);
    const selectedBudget = selectDailyMinutes(selectedDays, 120);

    expect(buildAcceptPayload(selectedBudget, false)).toBeNull();
    expect(buildAcceptPayload(selectedBudget, true)).toEqual({
      offerId: 'offer-2',
      targetStudyDays: 30,
      dailyMinutes: 120,
      consent: true
    });
  });

  it('dismisses an offer without accepting it and disables consent while pending', () => {
    const stateWithOffer = receiveAnswer(createPersonalLearningState(), {
      answer: 'A vector has magnitude and direction.',
      offer: { id: 'offer-3', suggestedStudyDays: 7, reason: 'A week allows practice.' }
    });
    const acceptingState = beginAccept(stateWithOffer, true);

    expect(acceptingState?.isAccepting).toBe(true);
    expect(beginAccept(acceptingState!, true)).toBe(acceptingState);
    expect(dismissOffer(stateWithOffer)).toMatchObject({ offer: null, isAccepting: false });
  });

  it('renders only sessions returned by the server, never a planned future session', () => {
    const state = {
      ...createPersonalLearningState(),
      targetStudyDays: 30,
      sessions: [{ sessionIndex: 1, status: 'ready' as const }]
    };

    expect(visibleSessionIndexes(state)).toEqual([1]);
    expect(visibleSessionIndexes({ ...state, sessions: [] })).toEqual([]);
  });

  it('offers URL retry for source failures only', () => {
    expect(isSourceRetryableFailure('NO_VERIFIABLE_SOURCE')).toBe(true);
    expect(isSourceRetryableFailure('LEARNING_SOURCE_FETCH_FAILED')).toBe(true);
    expect(isSourceRetryableFailure('AI_NOT_CONFIGURED')).toBe(false);
  });
});
