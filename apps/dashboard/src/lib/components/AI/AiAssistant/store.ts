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

export interface SupportedModel {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

// Mirrors the list in apps/api/src/constants/models.ts
export const SUPPORTED_MODELS: SupportedModel[] = [
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: "Google's latest Flash — fast and capable",
    recommended: true
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Balanced speed and quality'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: "OpenAI's flagship — best quality"
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable'
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    description: 'Excellent writing, very affordable'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Open source, extremely affordable'
  }
];

export const DEFAULT_MODEL_ID = SUPPORTED_MODELS[0].id;

export interface AiAssistantState {
  isOpen: boolean;
  messages: AiMessage[];
  isLoading: boolean;
  courseId: string;
  lessonId: string | null;
  exerciseId: string | null;
  selectedModel: string;
}

function createAiAssistantStore() {
  const initialState: AiAssistantState = {
    isOpen: false,
    messages: [],
    isLoading: false,
    courseId: '',
    lessonId: null,
    exerciseId: null,
    selectedModel: DEFAULT_MODEL_ID
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

    setModel(modelId: string) {
      update((s) => ({ ...s, selectedModel: modelId }));
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
