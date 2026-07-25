import postgres from 'postgres';

const sql = postgres('postgresql://postgres:chifez01@localhost:5432/classroomio');

async function run() {
  try {
    await sql`ALTER TABLE course_newsfeed_comment ADD COLUMN IF NOT EXISTS parent_id bigint;`;
    console.log('Column added successfully');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
