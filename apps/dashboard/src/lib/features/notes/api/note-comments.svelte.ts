import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { TCreateNoteCommentThread, TUpdateNoteCommentThread } from '@cio/utils/validation/notes';
import type {
  CreateNoteCommentReplyRequest,
  CreateNoteCommentThreadRequest,
  ListNoteCommentThreadsRequest,
  NoteCommentThread,
  UpdateNoteCommentThreadRequest
} from '../utils/types';

class NoteCommentsApi extends BaseApiWithErrors {
  threads = $state<NoteCommentThread[]>([]);
  activeNoteId = $state<string | null>(null);

  async listThreads(noteId: string) {
    this.activeNoteId = noteId;

    await this.execute<ListNoteCommentThreadsRequest>({
      requestFn: () => classroomio.notes[':noteId']['comment-threads'].$get({ param: { noteId } }),
      onSuccess: (result) => {
        this.threads = result.data;
      },
      logContext: 'listNoteCommentThreads',
      onError: () => {
        this.threads = [];
      }
    });
  }

  async createThread(noteId: string, payload: TCreateNoteCommentThread) {
    let created: NoteCommentThread | null = null;

    await this.execute<CreateNoteCommentThreadRequest>({
      requestFn: () =>
        classroomio.notes[':noteId']['comment-threads'].$post({
          param: { noteId },
          json: payload
        }),
      onSuccess: (result) => {
        created = result.data;
        this.threads = [...this.threads.filter((thread) => thread.id !== result.data.id), result.data].sort(
          (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        );
      },
      logContext: 'createNoteCommentThread'
    });

    return created;
  }

  async addReply(noteId: string, threadId: string, body: string) {
    await this.execute<CreateNoteCommentReplyRequest>({
      requestFn: () =>
        classroomio.notes[':noteId']['comment-threads'][':threadId'].replies.$post({
          param: { noteId, threadId },
          json: { body }
        }),
      onSuccess: (result) => {
        if (result.data.thread) {
          this.threads = this.threads.map((thread) => (thread.id === threadId ? result.data.thread! : thread));
        }
      },
      logContext: 'createNoteCommentReply'
    });
  }

  async updateThreadStatus(noteId: string, threadId: string, payload: TUpdateNoteCommentThread) {
    let updated: NoteCommentThread | null = null;

    await this.execute<UpdateNoteCommentThreadRequest>({
      requestFn: () =>
        classroomio.notes[':noteId']['comment-threads'][':threadId'].$patch({
          param: { noteId, threadId },
          json: payload
        }),
      onSuccess: (result) => {
        updated = result.data;
        this.threads = this.threads.map((thread) => (thread.id === threadId ? result.data : thread));
      },
      logContext: 'updateNoteCommentThread'
    });

    return updated;
  }

  reset() {
    this.threads = [];
    this.activeNoteId = null;
  }
}

export const noteCommentsApi = new NoteCommentsApi();
