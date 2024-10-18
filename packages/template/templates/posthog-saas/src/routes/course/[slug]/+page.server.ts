import fs from 'fs';
import path from 'path';

export const load = async ({ params }) => {
  const slug = params.slug || '';
  const courseDirPath = path.join(process.cwd(), `src/lib/courses/${slug}`);

  // Path to the metadata.json file
  const courseFilePath = path.join(courseDirPath, 'metadata.json');

  // Read metadata.json
  const metadata = JSON.parse(fs.readFileSync(courseFilePath, 'utf-8'));

  // Get all markdown files from the course directory
  const lessonFiles = fs.readdirSync(courseDirPath).filter((file) => file.endsWith('.md'));

  // Extract title and position from the front matter of each lesson
  const lessons = lessonFiles.map((lessonFile) => {
    const lessonFilePath = path.join(courseDirPath, lessonFile);
    const lessonContent = fs.readFileSync(lessonFilePath, 'utf-8');

    // Correct regex to extract the entire front matter block
    const frontMatterMatch = lessonContent.match(/---\s*([\s\S]+?)\s*---/);

    let position = 1;
    let title = lessonFile.replace('.md', ''); // Default title from filename

    if (frontMatterMatch) {
      console.log('front matter', 'true', frontMatterMatch);
      const frontMatter = frontMatterMatch[1];

      // Extract title and position from the front matter block
      const titleMatch = frontMatter.match(/title:\s*['"](.+?)['"]/);
      const positionMatch = frontMatter.match(/position:\s*(\d+)/);

      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      if (positionMatch) {
        position = parseInt(positionMatch[1], 10);
      }
    }

    return { title, position, filename: lessonFile };
  });

  // Sort lessons by position
  lessons.sort((a, b) => a.position - b.position);
  console.log('lesson bakend', lessons);
  return { metadata, lessons, slug };
};
