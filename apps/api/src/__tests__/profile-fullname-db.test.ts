import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('setProfileFullnameIfUnset against the database', () => {
  const suffix = `${Date.now()}`;
  const userIds: string[] = [];

  async function createProfile(fullname: string, label: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const email = `${label}-${suffix}@fullname.test`;
    const [user] = await db.insert(schema.user).values({ name: label, email, emailVerified: true }).returning();

    userIds.push(user.id);
    await db.insert(schema.profile).values({ id: user.id, fullname, username: `${label}-${suffix}`, email });

    return user.id;
  }

  async function readFullname(id: string) {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const [row] = await db.select().from(schema.profile).where(eq(schema.profile.id, id));

    return row.fullname;
  }

  beforeAll(() => {
    userIds.length = 0;
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    for (const id of userIds) {
      await db.delete(schema.profile).where(eq(schema.profile.id, id));
      await db.delete(schema.user).where(eq(schema.user.id, id));
    }
  });

  it('writes the name over the email-prefix placeholder created at signup', async () => {
    const { setProfileFullnameIfUnset } = await import('@db/queries/auth/profile');
    const id = await createProfile(`placeholder-${suffix}`, 'placeholder');

    expect(await setProfileFullnameIfUnset(id, 'Ada Lovelace')).toBe(true);
    expect(await readFullname(id)).toBe('Ada Lovelace');
  });

  it('writes the name when the stored name is blank', async () => {
    const { setProfileFullnameIfUnset } = await import('@db/queries/auth/profile');
    const id = await createProfile('  ', 'blank');

    expect(await setProfileFullnameIfUnset(id, 'Grace Hopper')).toBe(true);
    expect(await readFullname(id)).toBe('Grace Hopper');
  });

  it('keeps a name the person already chose', async () => {
    const { setProfileFullnameIfUnset } = await import('@db/queries/auth/profile');
    const id = await createProfile('Katherine Johnson', 'chosen');

    expect(await setProfileFullnameIfUnset(id, 'Someone Else')).toBe(false);
    expect(await readFullname(id)).toBe('Katherine Johnson');
  });
});
