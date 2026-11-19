import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';

import { ROLE } from '@cio/utils/constants';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

const suffix = Date.now();

/** Minimal stand-in for better-auth's signUpEmail: inserts the user + profile and returns the user. */
async function makeSignUpStub() {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  return async ({ body }: { body: { name: string; email: string; password: string; image?: string } }) => {
    const [userRow] = await db
      .insert(schema.user)
      .values({ name: body.name, email: body.email, emailVerified: true, image: body.image ?? null })
      .returning();
    await db
      .insert(schema.profile)
      .values({ id: userRow.id, fullname: body.name, username: `${body.email}-${suffix}`, email: body.email });

    return { user: userRow as never };
  };
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

/** Minimal HS256 JWT, so the test needs no JWT dependency. */
function signToken(secret: string, claims: { sub: string; email: string; name?: string; avatar?: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ ...claims, iat: now, exp: now + 120 }));
  const signingInput = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}

describe.skipIf(!hasDatabase)('token exchange identity binding', () => {
  const ATTACKER_SECRET = `attacker-secret-${suffix}-0123456789abcdef`;
  let attackerOrgId = '';
  let victimOrgId = '';
  let victimUserId = '';
  const victimEmail = `victim-${suffix}@tokenauth.test`;

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const { createOrganization } = await import('@db/queries/organization');
    const { createTokenAuth } = await import('@db/queries/organization/token-auth');
    const schema = await import('@db/schema');

    const attackerOrg = await createOrganization({ name: `attacker-${suffix}` });
    attackerOrgId = attackerOrg.id;
    const victimOrg = await createOrganization({ name: `victim-${suffix}` });
    victimOrgId = victimOrg.id;

    // An admin profile is needed to own the token-auth config.
    const adminEmail = `admin-${suffix}@tokenauth.test`;
    const [adminUser] = await db
      .insert(schema.user)
      .values({ name: 'admin', email: adminEmail, emailVerified: true })
      .returning();
    await db
      .insert(schema.profile)
      .values({ id: adminUser.id, fullname: 'admin', username: `admin-${suffix}`, email: adminEmail });

    await createTokenAuth({
      organizationId: attackerOrgId,
      signingSecret: ATTACKER_SECRET,
      isActive: true,
      createdByProfileId: adminUser.id
    });

    // The victim is a member of the victim org ONLY.
    const [victim] = await db
      .insert(schema.user)
      .values({ name: 'victim', email: victimEmail, emailVerified: true })
      .returning();
    victimUserId = victim.id;
    await db
      .insert(schema.profile)
      .values({ id: victimUserId, fullname: 'victim', username: `victim-${suffix}`, email: victimEmail });
    await db.insert(schema.organizationmember).values({
      organizationId: victimOrgId,
      roleId: ROLE.ADMIN,
      email: victimEmail,
      profileId: victimUserId,
      status: 'ACTIVE'
    });
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const { inArray } = await import('drizzle-orm');
    const schema = await import('@db/schema');
    const orgIds = [attackerOrgId, victimOrgId].filter(Boolean);
    if (orgIds.length === 0) return;

    // organizationmember has no ON DELETE cascade from organization, so clear child rows first.
    try {
      await db
        .delete(schema.organizationTokenAuthIdentity)
        .where(inArray(schema.organizationTokenAuthIdentity.organizationId, orgIds));
      await db
        .delete(schema.organizationTokenAuth)
        .where(inArray(schema.organizationTokenAuth.organizationId, orgIds));
      await db.delete(schema.organizationmember).where(inArray(schema.organizationmember.organizationId, orgIds));
      await db.delete(schema.organization).where(inArray(schema.organization.id, orgIds));
    } catch (error) {
      console.error('token-exchange test cleanup failed (non-fatal):', error);
    }
  });

  it('refuses to sign in an account that belongs to another organization', async () => {
    const { exchangeToken } = await import('@db/auth/token-exchange');
    const token = await signToken(ATTACKER_SECRET, { sub: 'ext-victim', email: victimEmail });

    await expect(exchangeToken(token, { signUpEmail: await makeSignUpStub() })).rejects.toMatchObject({
      code: 'TOKEN_EXCHANGE_EMAIL_CONFLICT'
    });
  });

  it('creates and binds a brand-new email, then returns the same user for the same sub', async () => {
    const { exchangeToken } = await import('@db/auth/token-exchange');
    const { getTokenAuthIdentityUserId } = await import('@db/queries/organization/token-auth');
    const newEmail = `fresh-${suffix}@tokenauth.test`;

    const first = await exchangeToken(await signToken(ATTACKER_SECRET, { sub: 'ext-fresh', email: newEmail }), {
      signUpEmail: await makeSignUpStub()
    });
    expect(first.orgId).toBe(attackerOrgId);
    expect(first.user.email).toBe(newEmail);
    expect(await getTokenAuthIdentityUserId(attackerOrgId, 'ext-fresh')).toBe(first.user.id);

    // Same sub, different email in the token → the bound user, not a new lookup by email.
    const second = await exchangeToken(
      await signToken(ATTACKER_SECRET, { sub: 'ext-fresh', email: `changed-${suffix}@tokenauth.test` }),
      { signUpEmail: await makeSignUpStub() }
    );
    expect(second.user.id).toBe(first.user.id);
  });

  it('signs in an existing account once it is a member of the organization', async () => {
    const { db } = await import('@db/drizzle');
    const { exchangeToken } = await import('@db/auth/token-exchange');
    const schema = await import('@db/schema');

    await db.insert(schema.organizationmember).values({
      organizationId: attackerOrgId,
      roleId: ROLE.STUDENT,
      email: victimEmail,
      profileId: victimUserId,
      status: 'ACTIVE'
    });

    const result = await exchangeToken(await signToken(ATTACKER_SECRET, { sub: 'ext-victim-2', email: victimEmail }), {
      signUpEmail: await makeSignUpStub()
    });
    expect(result.user.id).toBe(victimUserId);
  });
});
