import type { AnswerData } from '@cio/question-types';
import { ErrorCodes } from '@cio/utils/constants';
import {
  ZVideoCheckpointAnswerData,
  ZVideoCheckpointCreate,
  ZVideoCheckpointUpdate
} from '@cio/utils/validation/lesson';
import type { TVideoCheckpointCreate, TVideoCheckpointUpdate } from '@cio/utils/validation/lesson';
import { SvelteSet } from 'svelte/reactivity';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
import { snackbar } from '$features/ui/snackbar/store';
import { toggleConfetti } from '$features/ui/confetti/store';
import { updateLessonCompletionInCourseContent } from '../utils/content-completion';
import { courseApi } from './course.svelte';
import { lessonApi } from './lesson.svelte';
import type {
  AnswerVideoCheckpointRequest,
  CreateVideoCheckpointRequest,
  DeleteVideoCheckpointRequest,
  GetVideoCheckpointResultsRequest,
  ListVideoCheckpointsRequest,
  UpdateVideoCheckpointRequest,
  VideoCheckpoint,
  VideoCheckpointAnswerResult,
  VideoCheckpointResults
} from '../utils/types';

/**
 * In-video questions for the lesson that is currently open. `satisfiedIds` is what gates playback (an answered
 * `correct`-policy checkpoint with a wrong answer is answered but not satisfied); `answeredIds` feeds results.
 */
class VideoCheckpointApi extends BaseApiWithErrors {
  checkpoints = $state<VideoCheckpoint[]>([]);
  answeredIds = new SvelteSet<string>();
  satisfiedIds = new SvelteSet<string>();
  loadedLessonId = $state('');
  results = $state<VideoCheckpointResults | null>(null);
  isSaving = $state(false);
  isAnswering = $state(false);
  isLoadingResults = $state(false);
  isExporting = $state(false);
  private loadSeq = 0;

  forAsset(assetId: string | null | undefined): VideoCheckpoint[] {
    if (!assetId) return [];

    return this.checkpoints
      .filter((checkpoint) => checkpoint.assetId === assetId)
      .sort((left, right) => left.timestampSeconds - right.timestampSeconds);
  }

  async load(courseId: string, lessonId: string) {
    const requestSeq = ++this.loadSeq;

    return this.execute<ListVideoCheckpointsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].checkpoints.$get({ param: { courseId, lessonId } }),
      logContext: 'listing video checkpoints',
      onSuccess: (response) => {
        if (requestSeq !== this.loadSeq) return;

        this.checkpoints = response.data.checkpoints;
        this.answeredIds.clear();
        this.satisfiedIds.clear();
        response.data.answeredCheckpointIds.forEach((id) => this.answeredIds.add(id));
        response.data.satisfiedCheckpointIds.forEach((id) => this.satisfiedIds.add(id));
        this.loadedLessonId = lessonId;
      }
    });
  }

  dropAsset(assetId: string) {
    const removedIds = this.checkpoints.filter((checkpoint) => checkpoint.assetId === assetId).map((c) => c.id);
    this.checkpoints = this.checkpoints.filter((checkpoint) => checkpoint.assetId !== assetId);
    removedIds.forEach((id) => {
      this.answeredIds.delete(id);
      this.satisfiedIds.delete(id);
    });
  }

  clear() {
    this.loadSeq += 1;
    this.checkpoints = [];
    this.answeredIds.clear();
    this.satisfiedIds.clear();
    this.results = null;
    this.loadedLessonId = '';
  }

  async create(courseId: string, lessonId: string, fields: TVideoCheckpointCreate): Promise<boolean> {
    const parsed = ZVideoCheckpointCreate.safeParse(fields);
    if (!parsed.success) {
      snackbar.error('snackbar.lesson_video.checkpoint_failed');
      return false;
    }

    this.isSaving = true;
    const response = await this.execute<CreateVideoCheckpointRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].checkpoints.$post({
          param: { courseId, lessonId },
          json: parsed.data
        }),
      logContext: 'creating video checkpoint',
      onSuccess: (result) => {
        this.checkpoints = [...this.checkpoints, result.data];
      },
      onError: (result) => this.reportError(result)
    });
    this.isSaving = false;

    return Boolean(response);
  }

  async update(
    courseId: string,
    lessonId: string,
    checkpointId: string,
    fields: TVideoCheckpointUpdate
  ): Promise<boolean> {
    const parsed = ZVideoCheckpointUpdate.safeParse(fields);
    if (!parsed.success) {
      snackbar.error('snackbar.lesson_video.checkpoint_failed');
      return false;
    }

    this.isSaving = true;
    const response = await this.execute<UpdateVideoCheckpointRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].checkpoints[':checkpointId'].$put({
          param: { courseId, lessonId, checkpointId },
          json: parsed.data
        }),
      logContext: 'updating video checkpoint',
      onSuccess: (result) => {
        this.checkpoints = this.checkpoints.map((checkpoint) =>
          checkpoint.id === checkpointId ? result.data : checkpoint
        );
        this.answeredIds.delete(checkpointId);
        this.satisfiedIds.delete(checkpointId);
      },
      onError: (result) => this.reportError(result)
    });
    this.isSaving = false;

    return Boolean(response);
  }

  async remove(courseId: string, lessonId: string, checkpointId: string): Promise<boolean> {
    const response = await this.execute<DeleteVideoCheckpointRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].checkpoints[':checkpointId'].$delete({
          param: { courseId, lessonId, checkpointId }
        }),
      logContext: 'deleting video checkpoint',
      onSuccess: () => {
        this.checkpoints = this.checkpoints.filter((checkpoint) => checkpoint.id !== checkpointId);
        this.answeredIds.delete(checkpointId);
        this.satisfiedIds.delete(checkpointId);
      },
      onError: (result) => this.reportError(result)
    });

    return Boolean(response);
  }

  async answer(
    courseId: string,
    lessonId: string,
    checkpointId: string,
    answerData: AnswerData
  ): Promise<VideoCheckpointAnswerResult | null> {
    const parsed = ZVideoCheckpointAnswerData.safeParse(answerData);
    if (!parsed.success) return null;

    this.isAnswering = true;
    const response = await this.execute<AnswerVideoCheckpointRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].checkpoints[':checkpointId'].answer.$post({
          param: { courseId, lessonId, checkpointId },
          json: { answerData: parsed.data }
        }),
      logContext: 'answering video checkpoint',
      onSuccess: (result) => {
        this.answeredIds.add(checkpointId);
        if (result.data.satisfied) this.satisfiedIds.add(checkpointId);
        if (result.data.didJustComplete) this.markLessonCompleted(lessonId);
      }
    });
    this.isAnswering = false;

    return response?.data ?? null;
  }

  async loadResults(courseId: string, lessonId: string) {
    this.isLoadingResults = true;
    const response = await this.execute<GetVideoCheckpointResultsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].lesson[':lessonId'].checkpoints.results.$get({
          param: { courseId, lessonId }
        }),
      logContext: 'loading video checkpoint results',
      onSuccess: (result) => {
        this.results = result.data;
      },
      onError: (result) => this.reportError(result)
    });
    this.isLoadingResults = false;

    return response?.data ?? null;
  }

  async exportResultsCsv(courseId: string, lessonId: string) {
    this.isExporting = true;

    try {
      const response = await classroomio.course[':courseId'].lesson[':lessonId'].checkpoints.results.csv.$get({
        param: { courseId, lessonId }
      });
      if (!response.ok) {
        snackbar.error('snackbar.lesson_video.checkpoint_export_failed');
        return;
      }

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'video-question-results.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting video checkpoint results:', error);
      snackbar.error('snackbar.lesson_video.checkpoint_export_failed');
    } finally {
      this.isExporting = false;
    }
  }

  private markLessonCompleted(lessonId: string) {
    toggleConfetti();
    setTimeout(() => toggleConfetti(), 3000);

    if (courseApi.course?.content) {
      courseApi.course = updateLessonCompletionInCourseContent(courseApi.course, lessonId, true);
    }

    if (lessonApi.lesson?.id === lessonId) {
      lessonApi.lesson = { ...lessonApi.lesson, isComplete: true };
    }
  }

  private reportError(result: unknown) {
    if (result && typeof result === 'object' && 'code' in result && result.code === ErrorCodes.UPGRADE_REQUIRED) {
      openUpgradeModal();
      return;
    }

    snackbar.error('snackbar.lesson_video.checkpoint_failed');
  }
}

export const videoCheckpointApi = /* @__PURE__ */ new VideoCheckpointApi();
