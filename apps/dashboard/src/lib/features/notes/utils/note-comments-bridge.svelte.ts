import type { MentionItem } from '@cio/ui/custom/mention-popover';
import type { TNoteCommentAnchor } from '@cio/utils/validation/notes';
import type { NoteCommentThread } from './types';

export interface NotePendingComposer {
  threadId: string;
  anchor: TNoteCommentAnchor;
  draft: string;
}

interface NoteCommentsBridgeHandlers {
  onSubmitPending?: () => void | Promise<void>;
  onCancelPending?: () => void;
  onResolveThread?: (thread: NoteCommentThread) => void | Promise<void>;
  onReopenThread?: (thread: NoteCommentThread) => void | Promise<void>;
  onRequestScroll?: (thread: NoteCommentThread) => void;
  onSelectThread?: (threadId: string) => void;
}

class NoteCommentsBridge {
  noteId = $state<string | null>(null);
  canComment = $state(false);
  currentUserId = $state<string | null>(null);
  mentionItems = $state<MentionItem[]>([]);
  activeThreadId = $state<string | null>(null);
  pendingComposer = $state<NotePendingComposer | null>(null);
  handlers = $state<NoteCommentsBridgeHandlers>({});

  reset() {
    this.noteId = null;
    this.canComment = false;
    this.currentUserId = null;
    this.mentionItems = [];
    this.activeThreadId = null;
    this.pendingComposer = null;
    this.handlers = {};
  }

  bindEditorContext(context: {
    noteId: string;
    canComment: boolean;
    currentUserId: string | null;
    mentionItems: MentionItem[];
    handlers: NoteCommentsBridgeHandlers;
  }) {
    this.noteId = context.noteId;
    this.canComment = context.canComment;
    this.currentUserId = context.currentUserId;
    this.mentionItems = context.mentionItems;
    this.handlers = context.handlers;
  }
}

export const noteCommentsBridge = new NoteCommentsBridge();
