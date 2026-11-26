import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/newsfeed', () => ({
  countNewsfeedCommentDescendants: vi.fn(),
  createNewsfeed: vi.fn(),
  createNewsfeedComment: vi.fn(),
  deleteNewsfeed: vi.fn(),
  deleteNewsfeedComment: vi.fn(),
  getNewsfeedByCourseId: vi.fn(),
  getNewsfeedByCourseIdPaginated: vi.fn(),
  getNewsfeedById: vi.fn(),
  getNewsfeedCommentById: vi.fn(),
  getNewsfeedCommentDepth: vi.fn(),
  getNewsfeedCommentThread: vi.fn(),
  getNewsfeedCommentsByFeedId: vi.fn(),
  getNewsfeedForEmail: vi.fn(),
  updateNewsfeed: vi.fn(),
  updateNewsfeedComment: vi.fn()
}));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));

import {
  createNewsfeedComment,
  deleteNewsfeed,
  getNewsfeedById,
  getNewsfeedCommentThread,
  updateNewsfeed
} from '@cio/db/queries/newsfeed';
import {
  createNewsfeedCommentService,
  deleteNewsfeedService,
  getNewsfeedCommentThreadService,
  getNewsfeedItem,
  updateNewsfeedReactionService,
  updateNewsfeedService
} from '@api/services/newsfeed/newsfeed';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const FEED_ID = '22222222-2222-4222-8222-222222222222';
const THREAD_OPTIONS = { rootLimit: 5, childLimit: 3, maxDepth: 3 };

describe('course newsfeed services only reach announcements of the course in the URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getNewsfeedById).mockResolvedValue(null);
    vi.mocked(updateNewsfeed).mockResolvedValue(null);
    vi.mocked(deleteNewsfeed).mockResolvedValue(null);
  });

  it('looks up, updates and deletes by course and feed id', async () => {
    await getNewsfeedItem(COURSE_ID, FEED_ID).catch(() => undefined);
    await updateNewsfeedService(COURSE_ID, FEED_ID, { content: 'x' }).catch(() => undefined);
    await updateNewsfeedReactionService(COURSE_ID, FEED_ID, {} as never).catch(() => undefined);
    await deleteNewsfeedService(COURSE_ID, FEED_ID).catch(() => undefined);

    expect(getNewsfeedById).toHaveBeenCalledWith(COURSE_ID, FEED_ID);
    expect(updateNewsfeed).toHaveBeenNthCalledWith(1, COURSE_ID, FEED_ID, expect.objectContaining({ content: 'x' }));
    expect(updateNewsfeed).toHaveBeenNthCalledWith(2, COURSE_ID, FEED_ID, { reaction: {} });
    expect(deleteNewsfeed).toHaveBeenCalledWith(COURSE_ID, FEED_ID);
  });

  it.each([
    ['reading', () => getNewsfeedItem(COURSE_ID, FEED_ID)],
    ['updating', () => updateNewsfeedService(COURSE_ID, FEED_ID, { content: 'x' })],
    ['reacting to', () => updateNewsfeedReactionService(COURSE_ID, FEED_ID, {} as never)],
    ['deleting', () => deleteNewsfeedService(COURSE_ID, FEED_ID)],
    ['listing comments of', () => getNewsfeedCommentThreadService(COURSE_ID, FEED_ID, THREAD_OPTIONS)],
    ['commenting on', () => createNewsfeedCommentService(COURSE_ID, FEED_ID, 'member-1', 'Hi')]
  ])('answers 404 when %s an announcement of another course', async (_action, run) => {
    await expect(run()).rejects.toMatchObject({ statusCode: 404 });
  });

  it('does not list comments or add a comment for another course’s announcement', async () => {
    await getNewsfeedCommentThreadService(COURSE_ID, FEED_ID, THREAD_OPTIONS).catch(() => undefined);
    await createNewsfeedCommentService(COURSE_ID, FEED_ID, 'member-1', 'Hi').catch(() => undefined);

    expect(getNewsfeedCommentThread).not.toHaveBeenCalled();
    expect(createNewsfeedComment).not.toHaveBeenCalled();
  });

  it('adds a comment when the announcement belongs to the course', async () => {
    vi.mocked(getNewsfeedById).mockResolvedValue({ id: FEED_ID, courseId: COURSE_ID } as never);
    vi.mocked(createNewsfeedComment).mockResolvedValue({ id: 1 } as never);

    await expect(createNewsfeedCommentService(COURSE_ID, FEED_ID, 'member-1', 'Hi')).resolves.toEqual({ id: 1 });
    expect(getNewsfeedById).toHaveBeenCalledWith(COURSE_ID, FEED_ID);
  });
});
