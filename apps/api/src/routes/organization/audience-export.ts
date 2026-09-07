import * as z from 'zod';

import { AUDIENCE_BULK_IDS_MAX, ZGetAudienceQuery } from '@cio/utils/validation/organization';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { getAudienceExportRows } from '@api/services/organization/audience-export';
import { handleError } from '@api/utils/errors';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { zValidator } from '@hono/zod-validator';

/**
 * Three export scopes, expressed explicitly rather than inferred.
 *
 * A filter-only endpoint cannot say "the 42 rows I ticked", and silently
 * widening that to the whole filtered set would hand someone a different list
 * than the one they asked for. So `memberIds` takes precedence and the filters
 * are ignored entirely when it is present, rather than intersected.
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

      return ids.length > 0 ? ids.slice(0, AUDIENCE_BULK_IDS_MAX) : undefined;
    })
});

/** RFC 4180 quoting: double the quotes, wrap anything containing a delimiter. */
function toCsvCell(value: string | number | null): string {
  if (value == null) return '';

  const asText = String(value);

  return /[",\r\n]/.test(asText) ? `"${asText.replace(/"/g, '""')}"` : asText;
}

/**
 * Streams the roster as `text/csv` straight from the API.
 *
 * Deliberately not an RPC data route: it returns a file rather than a typed
 * JSON envelope, so the single-return-type rule does not apply. It streams and
 * pages internally so a 20,000-learner export runs in constant memory and the
 * browser gets a real download rather than a JSON round trip with a row cap.
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

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          // The BOM makes Excel on Windows read this as UTF-8, so accented
          // learner names survive the round trip.
          controller.enqueue(encoder.encode('﻿'));
          controller.enqueue(encoder.encode(`${headers.join(',')}\r\n`));

          try {
            for await (const batch of getAudienceExportRows(orgId, query)) {
              const chunk = batch
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
                .join('\r\n');

              controller.enqueue(encoder.encode(`${chunk}\r\n`));
            }

            controller.close();
          } catch (error) {
            console.error('audience export stream error:', error);
            controller.error(error);
          }
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
