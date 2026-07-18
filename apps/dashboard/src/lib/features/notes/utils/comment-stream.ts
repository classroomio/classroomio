import { getRequestBaseUrl } from '$lib/utils/services/api';
import { get } from 'svelte/store';
import { currentOrg } from '$lib/utils/store/org';

export function connectNoteCommentStream(noteId: string, onEvent: () => void) {
  const controller = new AbortController();
  const org = get(currentOrg);
  const baseUrl = getRequestBaseUrl();
  const url = `${baseUrl}/notes/${noteId}/comment-threads/stream`;

  void (async () => {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          Accept: 'text/event-stream',
          ...(org?.id ? { 'cio-org-id': org.id } : {})
        },
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const eventLine = chunk.split('\n').find((line) => line.startsWith('event: '));
          const eventType = eventLine?.slice(7);

          if (eventType && eventType !== 'ping') {
            onEvent();
          }
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('connectNoteCommentStream error:', error);
      }
    }
  })();

  return () => {
    controller.abort();
  };
}
