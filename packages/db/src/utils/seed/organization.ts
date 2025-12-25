import { db, organization } from '@db/drizzle';

export async function seedOrganization({ testOrgId }: { testOrgId: string }) {
  const existingOrgs = await db.select().from(organization);
  const existingOrgIds = existingOrgs.map((o) => o.id);

  const organizationsToInsert = [
    {
      id: testOrgId,
      name: 'Udemy Test',
      siteName: 'udemy-test',
      settings: {},
      landingpage: {},
      theme: '',
      customization: {
        apps: { poll: true, comments: true },
        course: { grading: true, newsfeed: true },
        dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
      }
    }
  ].filter((o) => !existingOrgIds.includes(o.id));

  if (organizationsToInsert.length > 0) {
    await db.insert(organization).values(organizationsToInsert);
    console.log(`   ✓ Inserted ${organizationsToInsert.length} organization(s)`);
  } else {
    console.log('   ✓ Organizations already exist, skipping');
  }
}
