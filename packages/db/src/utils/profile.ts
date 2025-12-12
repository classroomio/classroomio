import { db, profile } from '@db/drizzle';

export async function seedProfile({ usersData }: { usersData }) {
  const existingProfiles = await db.select().from(profile);
  const existingProfileIds = existingProfiles.map((p) => p.id);

  const profilesToInsert = usersData
    .map((user) => ({
      id: user.id,
      fullname: user.profile_fullname,
      username: `${user.email.split('@')[0]}${Date.now()}`,
      email: user.email,
      avatarUrl: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/avatar.png',
      canAddCourse: true,
      isEmailVerified: true
    }))
    .filter((p) => !existingProfileIds.includes(p.id));

  if (profilesToInsert.length > 0) {
    await db.insert(profile).values(profilesToInsert);
    console.log(`   ✓ Inserted ${profilesToInsert.length} profile(s)`);
  } else {
    console.log('   ✓ Profiles already exist, skipping');
  }
}
