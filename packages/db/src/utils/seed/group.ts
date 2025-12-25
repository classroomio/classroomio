import { db, group } from '@db/drizzle';

interface SeedGroup {
  mvcGroupId: string;
  reactGroupId: string;
  pandasGroupId: string;
  testOrgId: string;
}

export async function seedGroup({ mvcGroupId, reactGroupId, pandasGroupId, testOrgId }: SeedGroup) {
  const existingGroups = await db.select().from(group);
  const existingGroupIds = existingGroups.map((g) => g.id);

  const groupsToInsert = [
    {
      id: mvcGroupId,
      name: 'Getting started with MVC',
      description:
        "Embark on a comprehensive journey into the world of Model-View-Controller (MVC) architecture with our course, 'Getting Started with MVC.' Designed for beginners and aspiring developers, this course provides a solid foundation for understanding the principles and practices behind MVC, a widely adopted design pattern in software development.",
      organizationId: testOrgId
    },
    {
      id: reactGroupId,
      name: 'Modern Web Development with React',
      description:
        "By the end of this course, you'll be equipped to build interactive and responsive web applications, making you a proficient React developer ready for the demands of today's web development landscape.",
      organizationId: testOrgId
    },
    {
      id: pandasGroupId,
      name: 'Data Science with Python and Pandas',
      description:
        'Unlock the power of data with our "Data Science with Python and Pandas" course. Dive into Python programming fundamentals and then journey into the world of Pandas for efficient data manipulation and analysis.',
      organizationId: testOrgId
    }
  ].filter((g) => !existingGroupIds.includes(g.id));

  if (groupsToInsert.length > 0) {
    await db.insert(group).values(groupsToInsert);
    console.log(`   ✓ Inserted ${groupsToInsert.length} group(s)`);
  } else {
    console.log('   ✓ Groups already exist, skipping');
  }
}
