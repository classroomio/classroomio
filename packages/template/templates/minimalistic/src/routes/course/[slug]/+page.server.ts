import fs from 'fs';
import path from 'path';

export const load = async ({ params }) => {
  const dataSlug = params.slug || '';
  const courseDirPath = path.join(process.cwd(), `src/lib/courses/${dataSlug}`);

  // Path to the metadata.json file
  const courseFilePath = path.join(courseDirPath, 'metadata.json');

  // Read metadata.json
  const metadata = JSON.parse(fs.readFileSync(courseFilePath, 'utf-8'));

  // Get all markdown files from the course directory
  const lessonFiles = fs.readdirSync(courseDirPath).filter((file) => file.endsWith('.md'));

  // Extract only the title from the front matter of each lesson
  const lessons = lessonFiles.map((lessonFile) => {
    const lessonFilePath = path.join(courseDirPath, lessonFile);
    const lessonContent = fs.readFileSync(lessonFilePath, 'utf-8');

    // Extract the front matter title
    const titleMatch = lessonContent.match(/^----\ntitle:\s*(.+?)\n----/);
    const title = titleMatch ? titleMatch[1] : lessonFile.replace('.md', '');

    return { title, filename: lessonFile };
  });

  return { metadata, lessons, dataSlug };
};
