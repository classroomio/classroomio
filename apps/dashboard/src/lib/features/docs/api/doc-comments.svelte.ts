import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  TAiNoteCommentReview,
  TCreateNoteCommentThread,
  TUpdateNoteComment,
  TUpdateNoteCommentThread
} from '@cio/utils/validation/docs';
import type {
  AiNoteCommentReviewRequest,
  AiNoteCommentReviewResult,
  CreateNoteCommentReplyRequest,
  CreateNoteCommentThreadRequest,
  DeleteNoteCommentRequest,
  ListNoteCommentThreadsRequest,
  NoteCommentThread,
  UpdateNoteCommentRequest,
  UpdateNoteCommentThreadRequest
} from '../utils/types';

class NoteCommentsApi extends BaseApiWithErrors {
  threads = $state<NoteCommentThread[]>([]);
  activeNoteId = $state<string | null>(null);

  async listThreads(docId: string) {
    this.activeNoteId = docId;

    await this.execute<ListNoteCommentThreadsRequest>({
      requestFn: () => classroomio.doc[':docId']['comment-threads'].$get({ param: { docId } }),
      onSuccess: (result) => {
        this.threads = result.data;
      },
      logContext: 'listNoteCommentThreads',
      onError: () => {
        this.threads = [];
      }
    });
  }

  async createThread(docId: string, payload: TCreateNoteCommentThread) {
    let created: NoteCommentThread | null = null;

    await this.execute<CreateNoteCommentThreadRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['comment-threads'].$post({
          param: { docId },
          json: payload
        }),
      onSuccess: (result) => {
        created = result.data;
        this.threads = [...this.threads.filter((thread) => thread.id !== result.data.id), result.data].sort(
          (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        );
      },
      logContext: 'createDocCommentThread'
    });

    return created;
  }

  async reviewWithAi(docId: string, payload: TAiNoteCommentReview) {
    let result: AiNoteCommentReviewResult | null = null;

    await this.execute<AiNoteCommentReviewRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['comment-threads']['ai-review'].$post({
          param: { docId },
          json: payload
        }),
      onSuccess: (response) => {
        result = response.data;
        this.threads = response.data.threads;
      },
      logContext: 'aiNoteCommentReview'
    });

    return result;
  }

  async addReply(docId: string, threadId: string, body: string) {
    await this.execute<CreateNoteCommentReplyRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['comment-threads'][':threadId'].replies.$post({
          param: { docId, threadId },
          json: { body }
        }),
      onSuccess: (result) => {
        if (result.data.thread) {
          this.threads = this.threads.map((thread) => (thread.id === threadId ? result.data.thread! : thread));
        }
      },
      logContext: 'createDocCommentReply'
    });
  }

  async updateThreadStatus(docId: string, threadId: string, payload: TUpdateNoteCommentThread) {
    let updated: NoteCommentThread | null = null;

    await this.execute<UpdateNoteCommentThreadRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['comment-threads'][':threadId'].$patch({
          param: { docId, threadId },
          json: payload
        }),
      onSuccess: (result) => {
        updated = result.data;
        this.threads = this.threads.map((thread) => (thread.id === threadId ? result.data : thread));
      },
      logContext: 'updateDocCommentThread'
    });

    return updated;
  }

  async updateComment(docId: string, commentId: string, body: string) {
    await this.execute<UpdateNoteCommentRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['comments'][':commentId'].$patch({
          param: { docId, commentId },
          json: { body }
        }),
      onSuccess: (result) => {
        if (result.data.thread) {
          this.threads = this.threads.map((thread) =>
            thread.id === result.data.thread!.id ? result.data.thread! : thread
          );
        }
      },
      logContext: 'updateDocComment'
    });
  }

  async deleteComment(docId: string, commentId: string) {
    await this.execute<DeleteNoteCommentRequest>({
      requestFn: () =>
        classroomio.doc[':docId']['comments'][':commentId'].$delete({
          param: { docId, commentId }
        }),
      onSuccess: (result) => {
        if (result.data.thread) {
          this.threads = this.threads.map((thread) =>
            thread.id === result.data.thread!.id ? result.data.thread! : thread
          );
        }
      },
      logContext: 'deleteNoteComment'
    });
  }

  reset() {
    this.threads = [];
    this.activeNoteId = null;
  }
}

export const docCommentsApi = new NoteCommentsApi();
