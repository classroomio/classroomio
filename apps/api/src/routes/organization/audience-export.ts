import * as z from 'zod';

import { AUDIENCE_BULK_IDS_MAX, ZGetAudienceQuery } from '@cio/utils/validation/organization';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { type AudienceExportRow, getAudienceExportRows } from '@api/services/organization/audience-export';
import { handleError } from '@api/utils/errors';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { zValidator } from '@hono/zod-validator';

/**
 * Three scopes: selected ids, current filters, or everything. `memberIds` takes
 * precedence and the filters are then ignored entirely, never intersected.
 */
const ZAudienceExportQuery = ZGetAudienceQuery.omit({ page: true, limit: true }).extend({
  memberIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (value == null) return undefined;

      const raw = Array.isArray(value) ? value : [value];
      const ids = raw
        .flatMap((entry) => entry.split(','))
        .map((entry) => Number(entry.trim()))
        .filter((id) => Number.isInteger(id) && id > 0);

      // Dedupe before the cap, so repeats cannot push a valid selection over.
      return ids.length > 0 ? [...new Set(ids)] : undefined;
    })
    // Refuse rather than truncate: a short export would look complete.
    .refine((ids) => ids == null || ids.length <= AUDIENCE_BULK_IDS_MAX, {
      message: `Select at most ${AUDIENCE_BULK_IDS_MAX} learners, or export the filtered view instead`
    })
});

/** RFC 4180 quoting: double the quotes, wrap anything containing a delimiter. */
function toCsvCell(value: string | number | null): string {
  if (value == null) return '';

  const asText = String(value);

  return /[",\r\n]/.test(asText) ? `"${asText.replace(/"/g, '""')}"` : asText;
}

/**
 * Streams the roster as `text/csv`. Not an RPC data route — it returns a file,
 * so the single-return-type rule does not apply.
 *
 * No row cap: one page is fetched per stream pull, so peak memory is one batch
 * and a slow client throttles the query instead of filling a queue.
 */
export const audienceExportRouter = new Hono().get(
  '/',
  authMiddleware,
  orgTeamMemberMiddleware,
  zValidator('query', ZAudienceExportQuery),
  async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const query = c.req.valid('query');

      const headers = [
        'Name',
        'Email',
        'Member status',
        'Invite status',
        'Joined',
        'Last login',
        'Last activity',
        'Courses enrolled',
        'Courses completed',
        'Progress %'
      ];

      const encoder = new TextEncoder();
      const batches = getAudienceExportRows(orgId, query);

      function encodeBatch(batch: AudienceExportRow[]): string {
        return `${batch
          .map((row) =>
            [
              row.name,
              row.email,
              row.memberStatus,
              row.inviteStatus,
              row.createdAt,
              row.lastLoginAt ?? '',
              row.lastActiveAt ?? '',
              row.enrolledCount,
              row.completedCount,
              row.progressPercent
            ]
              .map(toCsvCell)
              .join(',')
          )
          .join('\r\n')}\r\n`;
      }

      const stream = new ReadableStream({
        start(controller) {
          // BOM so Excel on Windows reads it as UTF-8.
          controller.enqueue(encoder.encode('﻿'));
          controller.enqueue(encoder.encode(`${headers.join(',')}\r\n`));
        },

        /** One batch per pull. Doing this in `start` would buffer the whole export. */
        async pull(controller) {
          try {
            const { value, done } = await batches.next();

            if (done) {
              controller.close();
              return;
            }

            if (value && value.length > 0) {
              controller.enqueue(encoder.encode(encodeBatch(value)));
            }
          } catch (error) {
            console.error('audience export stream error:', error);
            controller.error(error);
          }
        },

        /** Release the generator if the client disconnects mid-download. */
        async cancel(reason) {
          await batches.return(undefined as never).catch(() => undefined);
          console.warn('audience export cancelled:', reason);
        }
      });

      const filename = `audience-${new Date().toISOString().slice(0, 10)}.csv`;

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store'
        }
      });
    } catch (error) {
      return handleError(c, error, 'Failed to export audience');
    }
  }
);
