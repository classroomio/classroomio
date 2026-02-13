import { db, profile } from '@db/drizzle';

type TUserSeedData = {
  id: string;
  email: string;
  name?: string | null;
  profile_fullname?: string | null;
};

const resolveFullName = (seedUser: TUserSeedData) => {
  if (seedUser.name && seedUser.name.trim().length > 0) {
    return seedUser.name;
  }

  if (seedUser.profile_fullname && seedUser.profile_fullname.trim().length > 0) {
    return seedUser.profile_fullname;
  }

  return seedUser.email.split('@')[0];
};

export async function seedProfile({ usersData }: { usersData: TUserSeedData[] }) {
  const existingProfiles = await db.select().from(profile);
  const existingProfileIds = existingProfiles.map((p) => p.id);

  const profilesToInsert = usersData
    .map((user) => ({
      id: user.id,
      fullname: resolveFullName(user),
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
