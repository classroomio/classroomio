import { CIO_ENVELOPE_CONTENT_TYPE } from '@cio/utils/constants/b64-envelope';
import { useQuery } from '@tanstack/react-query';
import { fetch } from 'expo/fetch';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { ApiError, request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { getActiveOrgId, useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { useServer } from '@/feature/server/components/server-provider';
import { encodeBase64 } from '@/feature/lesson/helpers/base64';
import { readUiMessageStream, type TutorStreamEvent } from '@/feature/lesson/helpers/tutor-stream';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { TutorMessage } from '@/feature/lesson/types/tutor';

export const tutorStatusQueryKey = (userId: string | null, orgId: string | null, courseId: string) =>
  ['ai-tutor', 'status', userId, orgId, courseId] as const;

export function useTutorStatusQuery(courseId: string) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(tutorStatusQueryKey(userId, orgId, courseId), async () => {
      const response = await request(api.agent.status.$get({ query: { courseId } }));

      return response.data;
    }),
    enabled: Boolean(userId && orgId && courseId),
    staleTime: 60 * 1000
  });
}

type SendTutorMessageOptions = {
  courseId: string;
  lessonId: string;
  messages: TutorMessage[];
  signal: AbortSignal;
  onEvent: (event: TutorStreamEvent) => void;
};

/** Posts the conversation to `/agent/chat` and streams the AI SDK UI message stream back through `onEvent`. */
export function useSendTutorMessage() {
  const { serverUrl } = useServer();
  const { client } = useAuth();
  const t = useTranslations(lessonCatalog);

  return async ({ courseId, lessonId, messages, signal, onEvent }: SendTutorMessageOptions) => {
    const body = JSON.stringify({
      courseId,
      context: { lessonId },
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        parts: [{ type: 'text', text: message.text }]
      }))
    });
    const orgId = getActiveOrgId();
    const headers: Record<string, string> = {
      'content-type': CIO_ENVELOPE_CONTENT_TYPE,
      accept: 'text/event-stream',
      cookie: await client.getCookie()
    };
    if (orgId) headers['cio-org-id'] = orgId;

    const response = await fetch(new URL('/agent/chat', serverUrl).toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ b64: encodeBase64(new TextEncoder().encode(body)) }),
      signal
    });

    if (!response.ok || !response.body) {
      const payload: unknown = await response.json().catch(() => null);
      const record = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
      throw new ApiError(
        typeof record.error === 'string' ? record.error : t('tutorRequestFailed'),
        response.status,
        typeof record.code === 'string' ? record.code : undefined
      );
    }

    await readUiMessageStream(response.body, onEvent);
  };
}
