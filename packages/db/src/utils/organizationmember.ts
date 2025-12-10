import { db, organizationmember } from '@db/drizzle';

interface SeedOrganizationMember {
  testOrgId: string;
  adminUserId: string;
}

export async function seedOrganizationMember({ testOrgId, adminUserId }: SeedOrganizationMember) {
  const existingOrgMembers = await db.select().from(organizationmember);
  const existingOrgMemberKeys = existingOrgMembers.map((om) => `${om.organizationId}-${om.profileId}`);

  const studentUserId = '0c256e75-aa40-4f62-8d30-0217ca1c60d9';

  const orgMembersToInsert = [
    {
      organizationId: testOrgId,
      roleId: 1, // ADMIN
      profileId: adminUserId,
      verified: false
    },
    {
      organizationId: testOrgId,
      roleId: 3, // STUDENT
      profileId: studentUserId,
      verified: false
    }
  ].filter((om) => !existingOrgMemberKeys.includes(`${om.organizationId}-${om.profileId}`));

  if (orgMembersToInsert.length > 0) {
    await db.insert(organizationmember).values(orgMembersToInsert);
    console.log(`   ✓ Inserted ${orgMembersToInsert.length} organization member(s)`);
  } else {
    console.log('   ✓ Organization members already exist, skipping');
  }
}
