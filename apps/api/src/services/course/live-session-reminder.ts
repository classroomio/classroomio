import { listReminderDeliveriesByCourse } from '@cio/db/queries/course';
import type { TLiveSessionReminderDeliveriesQuery } from '@cio/utils/validation/course';

const DELIVERY_LOG_WINDOW_DAYS = 30;

/**
 * One page of the course's live session reminder deliveries for sessions in the last 30 days or later.
 */
export async function listLiveSessionReminderDeliveries(courseId: string, query: TLiveSessionReminderDeliveriesQuery) {
  const since = new Date(Date.now() - DELIVERY_LOG_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const { items, total } = await listReminderDeliveriesByCourse({
    courseId,
    sinceIso: since.toISOString(),
    page: query.page,
    limit: query.limit,
    status: query.status,
    lessonId: query.lessonId
  });
  const totalPages = Math.ceil(total / query.limit);

  return { items, page: query.page, limit: query.limit, total, totalPages };
}
