import { useEffect, useRef, useState } from 'react';

import { useSendAssistantMessage } from '@/feature/assistant/api/assistant';
import { assistantCatalog } from '@/feature/assistant/translations/catalog';
import type { AssistantUnavailableReason } from '@/feature/assistant/types/assistant';
import { ApiError } from '@/feature/common/api/request';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { TutorMessage } from '@/feature/lesson/types/tutor';

const UNAVAILABLE_CODES: Record<string, AssistantUnavailableReason> = {
  LEARNER_CAP_REACHED: 'cap_reached',
  POOL_EXHAUSTED: 'pool_exhausted',
  AI_TUTOR_DISABLED: 'disabled',
  AI_NOT_CONFIGURED: 'not_configured',
  LEARNER_ASSISTANT_NO_COURSES: 'no_courses'
};

let nextMessageId = 1;

function messageId() {
  return `a${Date.now().toString(36)}${(nextMessageId++).toString(36)}`;
}

/** Conversation state for the Home assistant. Messages live only for the life of the sheet. */
export function useAssistantChat() {
  const t = useTranslations(assistantCatalog);
  const send = useSendAssistantMessage();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<AssistantUnavailableReason | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const ask = async (text: string) => {
    const question = text.trim();
    if (!question || streaming) return;

    const userMessage: TutorMessage = { id: messageId(), role: 'user', text: question };
    const answerId = messageId();
    const history = [...messages, userMessage];
    setMessages([...history, { id: answerId, role: 'assistant', text: '' }]);
    setStreaming(true);
    setError(null);

    const abort = new AbortController();
    controller.current = abort;

    try {
      await send({
        messages: history,
        signal: abort.signal,
        onEvent: (event) => {
          if (event.type === 'text') {
            setMessages((current) =>
              current.map((message) =>
                message.id === answerId ? { ...message, text: message.text + event.delta } : message
              )
            );
          }
          if (event.type === 'error') setError(event.message ?? t('stopped'));
        }
      });
    } catch (cause) {
      if (abort.signal.aborted) return;

      const reason = cause instanceof ApiError && cause.code ? UNAVAILABLE_CODES[cause.code] : undefined;
      if (reason) setUnavailable(reason);
      else setError(errorMessage(cause));
      setMessages((current) => current.filter((message) => message.id !== answerId || message.text.length > 0));
    } finally {
      if (controller.current === abort) controller.current = null;
      setStreaming(false);
    }
  };

  const stop = () => controller.current?.abort();

  return { messages, streaming, error, unavailable, ask, stop };
}
