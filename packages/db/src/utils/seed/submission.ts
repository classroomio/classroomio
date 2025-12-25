import { db, submissionstatus } from '@db/drizzle';

export async function seedSubmissions() {
  const existingStatuses = await db.select().from(submissionstatus);
  const statusLabels = existingStatuses.map((s) => s.label);

  const statusesToInsert = [
    {
      label: 'Submitted'
    },
    {
      label: 'In Progress'
    },
    {
      label: 'Graded'
    }
  ].filter((s) => !statusLabels.includes(s.label));

  if (statusesToInsert.length > 0) {
    await db.insert(submissionstatus).values(statusesToInsert);
    console.log(`   ✓ Inserted ${statusesToInsert.length} submission status(es)`);
  } else {
    console.log('   ✓ Submission statuses already exist, skipping');
  }
}
