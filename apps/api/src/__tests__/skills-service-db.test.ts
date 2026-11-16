import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

describe.skipIf(!hasDatabase)('skills service against the database', () => {
  const suffix = `${Date.now()}`;
  const organizationIds: string[] = [];
  let orgId = '';
  let otherOrgId = '';

  beforeAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');
    const orgs = await db
      .insert(schema.organization)
      .values([
        { name: `Skills svc A ${suffix}`, siteName: `skills-svc-a-${suffix}` },
        { name: `Skills svc B ${suffix}`, siteName: `skills-svc-b-${suffix}` }
      ])
      .returning();
    orgId = orgs[0].id;
    otherOrgId = orgs[1].id;
    organizationIds.push(orgId, otherOrgId);
  });

  afterAll(async () => {
    const { db } = await import('@db/drizzle');
    const schema = await import('@db/schema');

    await db.delete(schema.organization).where(inArray(schema.organization.id, organizationIds));
  });

  it('imports a CSV after a dry run and updates on a second import', async () => {
    const { importSkillsService, listSkillsService } = await import('@api/services/skill/skill');
    const csv = 'code,name,description,parent_code,framework\nR,Root,,,FW\nC,Child,Kid,R,FW\n';

    const preview = await importSkillsService(orgId, { csv, dryRun: true });
    expect(preview).toMatchObject({ dryRun: true, imported: false, toCreate: 2, toUpdate: 0, errors: [] });
    expect(await listSkillsService(orgId, {})).toHaveLength(0);

    const result = await importSkillsService(orgId, { csv, dryRun: false });
    expect(result).toMatchObject({ imported: true, toCreate: 2 });

    const skills = await listSkillsService(orgId, {});
    const root = skills.find((skill) => skill.code === 'R')!;
    expect(skills.find((skill) => skill.code === 'C')!.parentId).toBe(root.id);

    const again = await importSkillsService(orgId, { csv: csv.replace('Kid', 'Kid 2'), dryRun: false });
    expect(again).toMatchObject({ toCreate: 0, toUpdate: 2 });
    expect((await listSkillsService(orgId, { search: 'kid 2' })).map((skill) => skill.code)).toEqual(['C']);
  });

  it('refuses an import with errors and writes nothing', async () => {
    const { importSkillsService, listSkillsService } = await import('@api/services/skill/skill');
    const before = (await listSkillsService(orgId, {})).length;

    await expect(
      importSkillsService(orgId, { csv: 'code,name,parent_code\nX,Ex,MISSING\n', dryRun: false })
    ).rejects.toMatchObject({ code: 'SKILL_IMPORT_INVALID' });
    expect(await listSkillsService(orgId, {})).toHaveLength(before);
  });

  it('prevents duplicate codes and parent cycles', async () => {
    const { createSkillService, listSkillsService, updateSkillService } = await import('@api/services/skill/skill');

    await expect(createSkillService(orgId, { code: 'r', name: 'dup' })).rejects.toMatchObject({
      code: 'SKILL_ALREADY_EXISTS'
    });

    const skills = await listSkillsService(orgId, {});
    const root = skills.find((skill) => skill.code === 'R')!;
    const child = skills.find((skill) => skill.code === 'C')!;

    await expect(updateSkillService(orgId, root.id, { parentId: child.id })).rejects.toMatchObject({
      code: 'SKILL_INVALID_PARENT'
    });
  });

  it('scopes skills and question tags to the organization', async () => {
    const { createSkillService, listSkillsService, setQuestionSkillsService } = await import(
      '@api/services/skill/skill'
    );
    const foreign = await createSkillService(otherOrgId, { code: 'F', name: 'Foreign' });

    expect((await listSkillsService(orgId, {})).some((skill) => skill.id === foreign.id)).toBe(false);
    await expect(setQuestionSkillsService(orgId, 1, { skillIds: [foreign.id] })).rejects.toMatchObject({
      code: 'SKILL_NOT_FOUND'
    });
  });
});
