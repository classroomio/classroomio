export type StudyDays = 1 | 7 | 30;
export type DailyMinutes = 30 | 60 | 120;

export type PersonalLearningMessage = { role: 'user' | 'assistant'; content: string };
export type PersonalLearningOffer = {
  id: string;
  suggestedStudyDays: StudyDays;
  reason: string;
  choices: readonly StudyDays[];
};
export type PersonalLearningSession = {
  sessionIndex: number;
  status: string;
  lessonId?: string | null;
  failureCode?: string | null;
};

export type PersonalLearningState = {
  messages: PersonalLearningMessage[];
  conversationId: string | null;
  offer: PersonalLearningOffer | null;
  goalDraft: string;
  selectedStudyDays: StudyDays;
  dailyMinutes: DailyMinutes;
  isAnswering: boolean;
  isAccepting: boolean;
  sessions: PersonalLearningSession[];
};

const SOURCE_RETRY_FAILURES = new Set([
  'NO_VERIFIABLE_SOURCE',
  'LEARNING_SOURCE_SEARCH_FAILED',
  'LEARNING_SOURCE_FETCH_FAILED',
  'UNSAFE_SOURCE_REDIRECT',
  'INVALID_SOURCE_URL',
  'LEARNING_SOURCE_QUOTA_EXCEEDED'
]);

export function createPersonalLearningState(): PersonalLearningState {
  return {
    messages: [],
    conversationId: null,
    offer: null,
    goalDraft: '',
    selectedStudyDays: 7,
    dailyMinutes: 30,
    isAnswering: false,
    isAccepting: false,
    sessions: []
  };
}

export function submitQuestion(state: PersonalLearningState, message: string): PersonalLearningState {
  const trimmedMessage = message.trim();
  if (!trimmedMessage || state.isAnswering || state.isAccepting) return state;

  return {
    ...state,
    messages: [...state.messages, { role: 'user', content: trimmedMessage }],
    offer: null,
    goalDraft: trimmedMessage,
    isAnswering: true
  };
}

export function receiveAnswer(
  state: PersonalLearningState,
  response: {
    answer: string;
    conversationId?: string;
    offer?: Omit<PersonalLearningOffer, 'choices'> | null;
  }
): PersonalLearningState {
  return {
    ...state,
    conversationId: response.conversationId ?? state.conversationId,
    messages: [...state.messages, { role: 'assistant', content: response.answer }],
    offer: response.offer ? { ...response.offer, choices: [1, 7, 30] } : null,
    goalDraft: response.offer
      ? ([...state.messages].reverse().find(({ role }) => role === 'user')?.content ?? state.goalDraft)
      : state.goalDraft,
    selectedStudyDays: response.offer?.suggestedStudyDays ?? state.selectedStudyDays,
    isAnswering: false
  };
}

export function selectStudyDays(state: PersonalLearningState, value: StudyDays): PersonalLearningState {
  return { ...state, selectedStudyDays: value };
}

export function selectDailyMinutes(state: PersonalLearningState, value: DailyMinutes): PersonalLearningState {
  return { ...state, dailyMinutes: value };
}

export function buildAcceptPayload(state: PersonalLearningState, consent: boolean) {
  const goal = state.goalDraft.trim();
  if (!state.offer || !consent || state.isAnswering || state.isAccepting || !goal) return null;

  return {
    offerId: state.offer.id,
    goal,
    targetStudyDays: state.selectedStudyDays,
    dailyMinutes: state.dailyMinutes,
    consent: true as const
  };
}

export function beginAccept(state: PersonalLearningState, consent: boolean): PersonalLearningState {
  if (!buildAcceptPayload(state, consent)) return state;

  return { ...state, isAccepting: true };
}

export function dismissOffer(state: PersonalLearningState): PersonalLearningState {
  return { ...state, offer: null, isAccepting: false };
}

export function visibleSessionIndexes(state: Pick<PersonalLearningState, 'sessions'>): number[] {
  return [
    ...new Set(state.sessions.map(({ sessionIndex }) => sessionIndex).filter((sessionIndex) => sessionIndex > 0))
  ].sort((first, second) => first - second);
}

export function isSourceRetryableFailure(failureCode: string | null | undefined): boolean {
  return Boolean(failureCode && SOURCE_RETRY_FAILURES.has(failureCode));
}
