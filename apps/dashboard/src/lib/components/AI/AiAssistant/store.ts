import { writable, derived } from 'svelte/store';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
  actions?: Array<{ type: string; description: string; result?: unknown }>;
  isError?: boolean;
}

export interface AiAssistantState {
  isOpen: boolean;
  messages: AiMessage[];
  isLoading: boolean;
  courseId: string;
  lessonId: string | null;
  exerciseId: string | null;
}

function createAiAssistantStore() {
  const initialState: AiAssistantState = {
    isOpen: false,
    messages: [],
    isLoading: false,
    courseId: '',
    lessonId: null,
    exerciseId: null
  };

  const { subscribe, set, update } = writable<AiAssistantState>(initialState);

  return {
    subscribe,

    open(courseId: string, lessonId?: string | null, exerciseId?: string | null) {
      update((s) => ({
        ...s,
        isOpen: true,
        courseId,
        lessonId: lessonId ?? null,
        exerciseId: exerciseId ?? null
      }));
    },

    close() {
      update((s) => ({ ...s, isOpen: false }));
    },

    toggle(courseId: string, lessonId?: string | null, exerciseId?: string | null) {
      update((s) => ({
        ...s,
        isOpen: !s.isOpen,
        courseId,
        lessonId: lessonId ?? null,
        exerciseId: exerciseId ?? null
      }));
    },

    addMessage(message: Omit<AiMessage, 'id' | 'timestamp'>) {
      const newMessage: AiMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date()
      };
      update((s) => ({ ...s, messages: [...s.messages, newMessage] }));
      return newMessage.id;
    },

    setLoading(loading: boolean) {
      update((s) => ({ ...s, isLoading: loading }));
    },

    clearMessages() {
      update((s) => ({ ...s, messages: [] }));
    },

    updateContext(lessonId?: string | null, exerciseId?: string | null) {
      update((s) => ({
        ...s,
        lessonId: lessonId ?? null,
        exerciseId: exerciseId ?? null
      }));
    },

    reset() {
      set(initialState);
    }
  };
}

export const aiAssistantStore = createAiAssistantStore();

export const isAiAssistantOpen = derived(aiAssistantStore, ($s) => $s.isOpen);
