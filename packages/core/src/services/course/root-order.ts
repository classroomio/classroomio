import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  getLastCourseRootOrder,
  getLastSectionItemOrder,
  isCourseRootOrderTaken,
  lockCourseForUpdate,
  shiftCourseRootOrders,
  type CourseOrderScope
} from '@cio/db/queries/course';
import { DEFAULT_CONTENT_GROUPING } from './utils';

type ItemPlacement = { sectionId?: string | null; lessonId?: string | null };

async function claimOrder(
  courseId: string,
  requestedOrder: number | null | undefined,
  excludeId: string | null,
  scope: CourseOrderScope,
  dbClient: DbOrTxClient
): Promise<number> {
  if (requestedOrder === null || requestedOrder === undefined) {
    const lastOrder = await getLastCourseRootOrder(courseId, dbClient, scope);
    return lastOrder + 1;
  }

  const isTaken = await isCourseRootOrderTaken(courseId, requestedOrder, excludeId, dbClient, scope);
  if (isTaken) {
    await shiftCourseRootOrders(courseId, requestedOrder, dbClient, scope);
  }

  return requestedOrder;
}

async function lockCourseGrouping(courseId: string, dbClient: DbOrTxClient) {
  const course = await lockCourseForUpdate(courseId, dbClient);
  return course?.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING;
}

/**
 * Returns the order a section should take, and frees that position. With no requested order the section goes last.
 * A requested order held by another entry moves that entry and every later one down one. In a grouped course
 * sections share positions with lessons, exercises and activities outside any section; with grouping off, only
 * with other sections. `excludeId` is the section being moved. Locks the course row, so pass the transaction that
 * writes the section to keep other writers out until it commits.
 */
export async function claimSectionOrder(
  courseId: string,
  requestedOrder: number | null | undefined,
  excludeId: string | null = null,
  dbClient: DbOrTxClient = db
): Promise<number> {
  const isGrouped = await lockCourseGrouping(courseId, dbClient);
  return claimOrder(courseId, requestedOrder, excludeId, isGrouped ? 'outline' : 'sections', dbClient);
}

/**
 * Returns the order a lesson or exercise should take, and frees that position, when the item sits in the course's
 * shared list: outside any section in a grouped course, or anywhere with grouping off. Otherwise returns
 * `requestedOrder` unchanged, since items in a section and exercises inside a lesson keep their own numbering.
 * `excludeId` is the item being moved. Locks the course row, so pass the transaction that writes the item.
 */
export async function claimItemOrder<TOrder extends number | null | undefined>(
  courseId: string,
  placement: ItemPlacement,
  requestedOrder: TOrder,
  excludeId: string | null = null,
  dbClient: DbOrTxClient = db
): Promise<TOrder | number> {
  const isGrouped = await lockCourseGrouping(courseId, dbClient);
  if (placement.lessonId || (isGrouped && placement.sectionId)) return requestedOrder;

  return claimOrder(courseId, requestedOrder, excludeId, isGrouped ? 'outline' : 'items', dbClient);
}

/**
 * Returns the order an activity should take, and frees that position. Activities are items, so one outside a section
 * in a grouped course, or any activity with grouping off, takes the next position in the course's shared list. One in
 * a section keeps the section's own numbering, so it goes after the section's last entry. Locks the course row, so
 * pass the transaction that writes the activity.
 */
export async function claimActivityOrder(
  courseId: string,
  sectionId: string | null,
  dbClient: DbOrTxClient = db
): Promise<number> {
  const isGrouped = await lockCourseGrouping(courseId, dbClient);
  if (isGrouped && sectionId) {
    const lastOrder = await getLastSectionItemOrder(sectionId, dbClient);
    return lastOrder + 1;
  }

  return claimOrder(courseId, undefined, null, isGrouped ? 'outline' : 'items', dbClient);
}
