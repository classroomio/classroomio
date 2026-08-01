import { createClient, type RedisClientType } from 'redis';
import { env } from '../../config/env';
import { logRedisUnavailableOnce, redis } from './redis';

export type NoteCommentStreamEventType =
  | 'thread_created'
  | 'reply'
  | 'thread_updated'
  | 'comment_updated'
  | 'comment_deleted';

export type NoteCommentStreamEvent = {
  type: NoteCommentStreamEventType;
  docId: string;
  threadId?: string;
  commentId?: string;
};

export function getNoteCommentsChannel(docId: string) {
  return `note:${docId}:comments`;
}

let subscriberClient: RedisClientType | null = null;

async function getSubscriberClient(): Promise<RedisClientType | null> {
  if (!env.REDIS_URL) {
    return null;
  }

  if (subscriberClient?.isOpen) {
    return subscriberClient;
  }

  try {
    subscriberClient = createClient({ url: env.REDIS_URL });
    subscriberClient.on('error', (error) => {
      logRedisUnavailableOnce('Redis subscriber unavailable', error);
    });
    await subscriberClient.connect();

    return subscriberClient;
  } catch (error) {
    logRedisUnavailableOnce('Redis subscriber connection failed', error);
    subscriberClient = null;

    return null;
  }
}

export async function publishNoteCommentEvent(
  docId: string,
  event: Omit<NoteCommentStreamEvent, 'docId'>
): Promise<void> {
  if (!env.REDIS_URL || !redis.isOpen) {
    return;
  }

  try {
    await redis.publish(getNoteCommentsChannel(docId), JSON.stringify({ ...event, docId }));
  } catch (error) {
    console.error('publishNoteCommentEvent error:', error);
  }
}

export async function subscribeNoteCommentEvents(
  docId: string,
  onMessage: (event: NoteCommentStreamEvent) => void
): Promise<() => Promise<void>> {
  const client = await getSubscriberClient();

  if (!client) {
    return async () => {};
  }

  const channel = getNoteCommentsChannel(docId);

  const handler = (message: string) => {
    try {
      onMessage(JSON.parse(message) as NoteCommentStreamEvent);
    } catch (error) {
      console.error('subscribeNoteCommentEvents parse error:', error);
    }
  };

  await client.subscribe(channel, handler);

  return async () => {
    await client.unsubscribe(channel, handler);
  };
}
