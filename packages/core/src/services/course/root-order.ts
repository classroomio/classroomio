import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  getLastCourseRootOrder,
  isCourseRootOrderTaken,
  lockCourseForUpdate,
  shiftCourseRootOrders
} from '@cio/db/queries/course';

/**
 * Returns the order a top-level outline entry should take, and frees that position. With no requested order the
 * entry goes after the last top-level entry. A requested order held by another entry moves that entry and every
 * later one down one. `excludeId` is the entry being moved, so it never counts as holding its own position.
 * Locks the course row, so pass the transaction that writes the entry to keep other writers out until it commits.
 */
export async function claimRootOrder(
  courseId: string,
  requestedOrder: number | null | undefined,
  excludeId: string | null = null,
  dbClient: DbOrTxClient = db
): Promise<number> {
  await lockCourseForUpdate(courseId, dbClient);

  if (requestedOrder === null || requestedOrder === undefined) {
    const lastOrder = await getLastCourseRootOrder(courseId, dbClient);
    return lastOrder + 1;
  }

  const isTaken = await isCourseRootOrderTaken(courseId, requestedOrder, excludeId, dbClient);
  if (isTaken) {
    await shiftCourseRootOrders(courseId, requestedOrder, dbClient);
  }

  return requestedOrder;
}
