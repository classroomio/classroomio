import { db, groupmember } from '@db/drizzle';

interface SeedGroupmember {
  mvcGroupId: string;
  reactGroupId: string;
  pandasGroupId: string;
  adminUserId: string;
  studentUserId: string;
  earlyAdopterGroupId: string;
  earlyAdopterAdminUserId: string;
  earlyAdopterStudentUserId: string;
}

export async function seedGroupmembers({
  mvcGroupId,
  reactGroupId,
  pandasGroupId,
  adminUserId,
  studentUserId,
  earlyAdopterGroupId,
  earlyAdopterAdminUserId,
  earlyAdopterStudentUserId
}: SeedGroupmember) {
  const existingGroupMembers = await db.select().from(groupmember);
  const existingGroupMemberKeys = existingGroupMembers.map((gm) => `${gm.groupId}-${gm.profileId || gm.email}`);

  const groupMembersToInsert = [
    {
      groupId: mvcGroupId,
      roleId: 2, // TUTOR
      profileId: adminUserId,
      email: 'admin@test.com'
    },
    {
      groupId: reactGroupId,
      roleId: 2, // TUTOR
      profileId: adminUserId,
      email: 'admin@test.com'
    },
    {
      groupId: pandasGroupId,
      roleId: 2, // TUTOR
      profileId: adminUserId,
      email: 'admin@test.com'
    },
    {
      groupId: pandasGroupId,
      roleId: 3, // STUDENT
      profileId: studentUserId
    },
    {
      groupId: earlyAdopterGroupId,
      roleId: 2, // TUTOR
      profileId: earlyAdopterAdminUserId,
      email: 'early-adopter@test.com'
    },
    {
      groupId: earlyAdopterGroupId,
      roleId: 3, // STUDENT
      profileId: earlyAdopterStudentUserId
    }
  ].filter((gm) => !existingGroupMemberKeys.includes(`${gm.groupId}-${gm.profileId || gm.email}`));

  if (groupMembersToInsert.length > 0) {
    await db.insert(groupmember).values(groupMembersToInsert);
    console.log(`   ✓ Inserted ${groupMembersToInsert.length} group member(s)`);
  } else {
    console.log('   ✓ Group members already exist, skipping');
  }
}
