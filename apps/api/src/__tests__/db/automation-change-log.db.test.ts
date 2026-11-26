import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';

import { recordAutomationChange } from '@api/services/organization/automation-change';

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!shouldRun)('automation change log (database)', () => {
  const organizationIds: string[] = [];
  const userIds: string[] = [];

  async function createKey(type: 'mcp' | 'api' | 'zapier') {
    const label = `change-log-${randomUUID()}`;
    const [organization] = await db.insert(schema.organization).values({ name: label }).returning();
    const [user] = await db
      .insert(schema.user)
      .values({ name: label, email: `${label}@example.com`, emailVerified: true })
      .returning();
    await db.insert(schema.profile).values({ id: user.id, fullname: label, username: label });
    const [key] = await db
      .insert(schema.organizationApiKey)
      .values({
        organizationId: organization.id,
        createdByProfileId: user.id,
        type,
        label,
        secretPrefix: label.slice(0, 32),
        secretHash: label
      })
      .returning();
    organizationIds.push(organization.id);
    userIds.push(user.id);

    return key;
  }

  async function readLog(organizationId: string) {
    return db
      .select()
      .from(schema.automationChangeLog)
      .where(eq(schema.automationChangeLog.organizationId, organizationId));
  }

  afterEach(async () => {
    for (const organizationId of organizationIds.splice(0)) {
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId));
    }
    for (const userId of userIds.splice(0)) {
      await db.delete(schema.profile).where(eq(schema.profile.id, userId));
      await db.delete(schema.user).where(eq(schema.user.id, userId));
    }
  });

  it('stores who made the change, through which channel, and which resources it touched', async () => {
    const key = await createKey('mcp');

    await recordAutomationChange({
      automationKey: key,
      clientName: 'Claude',
      actorProfileId: key.createdByProfileId,
      method: 'POST',
      route: '/public-api/v1/courses/:courseId/sections',
      action: 'create_course_section',
      resourceIds: { courseId: 'course-1', createdId: 'section-1' },
      statusCode: 201
    });

    expect(await readLog(key.organizationId)).toEqual([
      expect.objectContaining({
        organizationApiKeyId: key.id,
        keyType: 'mcp',
        channel: 'mcp',
        clientName: 'Claude',
        actorProfileId: key.createdByProfileId,
        method: 'POST',
        route: '/public-api/v1/courses/:courseId/sections',
        action: 'create_course_section',
        resourceIds: { courseId: 'course-1', createdId: 'section-1' },
        statusCode: 201
      })
    ]);
  });

  it('keeps the key type after the key is deleted, so Zapier changes stay distinguishable', async () => {
    const key = await createKey('zapier');

    await recordAutomationChange({
      automationKey: key,
      clientName: null,
      actorProfileId: key.createdByProfileId,
      method: 'DELETE',
      route: '/public-api/v1/courses/:courseId',
      action: 'DELETE /public-api/v1/courses/:courseId',
      resourceIds: { courseId: 'course-1' },
      statusCode: 200
    });
    await db.delete(schema.organizationApiKey).where(eq(schema.organizationApiKey.id, key.id));

    expect(await readLog(key.organizationId)).toEqual([
      expect.objectContaining({ organizationApiKeyId: null, keyType: 'zapier', channel: 'public_api' })
    ]);
  });

  it('removes an organization’s change log with the organization', async () => {
    const key = await createKey('api');

    await recordAutomationChange({
      automationKey: key,
      clientName: null,
      actorProfileId: key.createdByProfileId,
      method: 'PATCH',
      route: '/public-api/v1/organization',
      action: 'update_organization',
      resourceIds: {},
      statusCode: 200
    });
    await db.delete(schema.organization).where(eq(schema.organization.id, key.organizationId));

    expect(await readLog(key.organizationId)).toEqual([]);
  });
});
