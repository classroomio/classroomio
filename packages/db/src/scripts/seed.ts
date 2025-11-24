import 'dotenv/config';

import { db, questionType, role, submissionstatus } from '../drizzle';

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Seed roles
    console.log('📝 Seeding roles...');
    const existingRoles = await db.select().from(role);
    const existingRoleIds = existingRoles.map((r) => r.id);

    const rolesToInsert = [
      {
        id: 1,
        type: 'ADMIN',
        description: 'The main controller'
      },
      {
        id: 2,
        type: 'TUTOR',
        description: 'Can make changes to content, courses, but cant control passwords and cant add other tutors'
      },
      {
        id: 3,
        type: 'STUDENT',
        description: 'A student role, can interact with application but cant make changes'
      }
    ].filter((r) => !existingRoleIds.includes(r.id));

    if (rolesToInsert.length > 0) {
      await db.insert(role).values(rolesToInsert);
      console.log(`   ✓ Inserted ${rolesToInsert.length} role(s)`);
    } else {
      console.log('   ✓ Roles already exist, skipping');
    }

    // Seed submission statuses
    console.log('📝 Seeding submission statuses...');
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

    // Seed question types
    console.log('📝 Seeding question types...');
    const existingQuestionTypes = await db.select().from(questionType);
    const questionTypeNames = existingQuestionTypes.map((q) => q.typename);

    const questionTypesToInsert = [
      {
        label: 'Single answer',
        typename: 'RADIO',
        createdAt: '2021-08-07 18:49:46.246529+00',
        updatedAt: '2021-08-15 00:57:08.12069+00'
      },
      {
        label: 'Multiple answers',
        typename: 'CHECKBOX',
        createdAt: '2021-08-07 18:49:46.246529+00',
        updatedAt: '2021-08-15 00:57:27.935478+00'
      },
      {
        label: 'Paragraph',
        typename: 'TEXTAREA',
        createdAt: '2021-08-07 18:49:46.246529+00',
        updatedAt: '2021-08-15 00:57:38.634665+00'
      }
    ].filter((q) => !questionTypeNames.includes(q.typename));

    if (questionTypesToInsert.length > 0) {
      await db.insert(questionType).values(questionTypesToInsert);
      console.log(`   ✓ Inserted ${questionTypesToInsert.length} question type(s)`);
    } else {
      console.log('   ✓ Question types already exist, skipping');
    }

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
