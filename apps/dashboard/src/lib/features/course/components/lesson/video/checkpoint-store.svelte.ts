import { browser } from '$app/environment';
import type { AnswerData } from '@cio/question-types';
import type { LessonVideoCheckpoint, LessonVideoCheckpointAnswer } from './checkpoint-types';

const STORAGE_KEY = 'cio.lesson-video-checkpoints.v1';

type PersistedCheckpointState = {
  checkpoints: LessonVideoCheckpoint[];
  answers: LessonVideoCheckpointAnswer[];
};

function readPersistedState(): PersistedCheckpointState {
  if (!browser) {
    return { checkpoints: [], answers: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { checkpoints: [], answers: [] };

    const parsed = JSON.parse(raw) as Partial<PersistedCheckpointState>;
    const checkpoints = Array.isArray(parsed.checkpoints) ? parsed.checkpoints : [];
    const answers = Array.isArray(parsed.answers) ? parsed.answers : [];

    return { checkpoints, answers };
  } catch (error) {
    console.error('readPersistedState error:', error);
    return { checkpoints: [], answers: [] };
  }
}

class LessonVideoCheckpointStore {
  checkpoints = $state<LessonVideoCheckpoint[]>([]);
  answers = $state<LessonVideoCheckpointAnswer[]>([]);

  constructor() {
    const persisted = readPersistedState();
    this.checkpoints = persisted.checkpoints;
    this.answers = persisted.answers;
  }

  private persist() {
    if (!browser) return;

    const payload: PersistedCheckpointState = {
      checkpoints: this.checkpoints,
      answers: this.answers
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  listForAsset(lessonId: string, assetId: string | null | undefined): LessonVideoCheckpoint[] {
    if (!assetId) return [];

    return this.checkpoints
      .filter((checkpoint) => checkpoint.lessonId === lessonId && checkpoint.assetId === assetId)
      .sort((left, right) => left.timestampSeconds - right.timestampSeconds);
  }

  answersForCheckpoint(checkpointId: string): LessonVideoCheckpointAnswer[] {
    return this.answers.filter((answer) => answer.checkpointId === checkpointId);
  }

  answeredIdsFor(profileId: string | undefined, lessonId: string, assetId: string | null | undefined): string[] {
    if (!profileId || !assetId) return [];

    const checkpointIds = new Set(this.listForAsset(lessonId, assetId).map((checkpoint) => checkpoint.id));

    return this.answers
      .filter((answer) => answer.profileId === profileId && checkpointIds.has(answer.checkpointId))
      .map((answer) => answer.checkpointId);
  }

  upsert(checkpoint: LessonVideoCheckpoint) {
    const existingIndex = this.checkpoints.findIndex((item) => item.id === checkpoint.id);
    if (existingIndex === -1) {
      this.checkpoints = [...this.checkpoints, checkpoint];
    } else {
      const next = [...this.checkpoints];
      next[existingIndex] = checkpoint;
      this.checkpoints = next;
    }

    this.persist();
  }

  remove(checkpointId: string) {
    this.checkpoints = this.checkpoints.filter((checkpoint) => checkpoint.id !== checkpointId);
    this.answers = this.answers.filter((answer) => answer.checkpointId !== checkpointId);
    this.persist();
  }

  removeForAsset(lessonId: string, assetId: string) {
    const removedIds = new Set(
      this.checkpoints
        .filter((checkpoint) => checkpoint.lessonId === lessonId && checkpoint.assetId === assetId)
        .map((checkpoint) => checkpoint.id)
    );

    this.checkpoints = this.checkpoints.filter((checkpoint) => !removedIds.has(checkpoint.id));
    this.answers = this.answers.filter((answer) => !removedIds.has(answer.checkpointId));
    this.persist();
  }

  recordAnswer(input: {
    checkpoint: LessonVideoCheckpoint;
    profileId: string;
    displayName: string;
    avatarUrl: string;
    answerData: AnswerData;
    isCorrect: boolean;
  }): LessonVideoCheckpointAnswer {
    const existing = this.answers.find(
      (answer) => answer.checkpointId === input.checkpoint.id && answer.profileId === input.profileId
    );

    if (existing && (input.checkpoint.resumePolicy === 'any' || existing.isCorrect)) {
      return existing;
    }

    const nextAnswer: LessonVideoCheckpointAnswer = {
      checkpointId: input.checkpoint.id,
      profileId: input.profileId,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      answeredAt: new Date().toISOString(),
      answerData: input.answerData,
      isCorrect: input.isCorrect
    };

    if (existing) {
      this.answers = this.answers.map((answer) =>
        answer.checkpointId === existing.checkpointId && answer.profileId === existing.profileId ? nextAnswer : answer
      );
    } else {
      this.answers = [...this.answers, nextAnswer];
    }

    this.persist();

    return nextAnswer;
  }
}

export const lessonVideoCheckpointStore = new LessonVideoCheckpointStore();
