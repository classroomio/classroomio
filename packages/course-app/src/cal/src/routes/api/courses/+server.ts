import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';
import type { Course } from '$lib/utils/types/course';

async function getCourses(): Promise<Course[]> {
  console.log('fetching...');
  const courseDirPath = path.join(process.cwd(), '/src/courses/');

  console.time('fetch courses');

  // Helper function to count .md files recursively (async)
  const countMdFiles = async (dirPath: string): Promise<number> => {
    let mdFilesCount = 0;

    // Read all items in the directory
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });

    // Loop through each item
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        // Recursively count .md files in subdirectories
        mdFilesCount += await countMdFiles(itemPath);
      } else if (item.name.endsWith('.md')) {
        // Increment count if it's an .md file
        mdFilesCount += 1;
      }
    }

    return mdFilesCount;
  };

  // Read the list of course directories
  const courses = await Promise.all(
    fs.readdirSync(courseDirPath).map(async (courseFolder) => {
      const courseFolderPath = path.join(courseDirPath, courseFolder);

      // Path to the metadata.json file for this course
      const metadataFilePath = path.join(courseFolderPath, 'metadata.json');

      // Read metadata.json
      const course: Course = JSON.parse(fs.readFileSync(metadataFilePath, 'utf-8'));

      // Count all markdown (.md) files in the course directory, including subdirectories
      const lessonsCount = await countMdFiles(courseFolderPath);

      return {
        ...course,
        slug: courseFolder,
        lessonsCount
      };
    })
  );

  console.timeEnd('fetch courses');

  return courses;
}

export const GET = async () => {
  // Return the data as JSON with caching headers
  const courses = await getCourses();

  return json(courses);
};
