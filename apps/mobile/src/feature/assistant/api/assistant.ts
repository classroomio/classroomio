import { fetch } from 'expo/fetch';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { ApiError } from '@/feature/common/api/request';
import { assistantCatalog } from '@/feature/assistant/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { readUiMessageStream, type TutorStreamEvent } from '@/feature/lesson/helpers/tutor-stream';
import type { TutorMessage } from '@/feature/lesson/types/tutor';
import { getActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { useServer } from '@/feature/server/components/server-provider';

type SendAssistantMessageOptions = {
  messages: TutorMessage[];
  signal: AbortSignal;
  onEvent: (event: TutorStreamEvent) => void;
};

/** Posts the conversation to `/account/assistant/chat` and streams the reply back through `onEvent`. */
export function useSendAssistantMessage() {
  const { serverUrl } = useServer();
  const { client } = useAuth();
  const t = useTranslations(assistantCatalog);

  return async ({ messages, signal, onEvent }: SendAssistantMessageOptions) => {
    const orgId = getActiveOrgId();
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      cookie: await client.getCookie()
    };
    if (orgId) headers['cio-org-id'] = orgId;

    const response = await fetch(new URL('/account/assistant/chat', serverUrl).toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: messages.map((message) => ({
          id: message.id,
          role: message.role,
          parts: [{ type: 'text', text: message.text }]
        }))
      }),
      signal
    });

    if (!response.ok || !response.body) {
      const payload: unknown = await response.json().catch(() => null);
      const record = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
      throw new ApiError(
        typeof record.error === 'string' ? record.error : t('requestFailed'),
        response.status,
        typeof record.code === 'string' ? record.code : undefined
      );
    }

    await readUiMessageStream(response.body, onEvent);
  };
}
