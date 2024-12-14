import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';
import type { CourseMetadata, LandingPageContent } from '$lib/utils/types';

export const GET = async () => {
  const courseDirPath = path.join(process.cwd(), '/src/lib/courses/');
  const orgDirPath = path.join(process.cwd(), 'src/lib/data/home.json');

  console.time('Async operation');

  // Load orgData from home.json
  const orgData: LandingPageContent = JSON.parse(fs.readFileSync(orgDirPath, 'utf8'));

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
  const coursesData = await Promise.all(
    fs.readdirSync(courseDirPath).map(async (courseFolder) => {
      const courseFolderPath = path.join(courseDirPath, courseFolder);

      // Path to the metadata.json file for this course
      const metadataFilePath = path.join(courseFolderPath, 'metadata.json');

      // Read metadata.json
      const metadata: CourseMetadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf-8'));

      // Count all markdown (.md) files in the course directory, including subdirectories
      const totalLessons = await countMdFiles(courseFolderPath);

      return {
        data: {
          ...metadata,
          slug: courseFolder
        }, // Course metadata
        lessons: totalLessons // Total number of lessons (.md files)
      };
    })
  );

  console.timeEnd('Async operation');

  // Return the data as JSON
  return json({ org: orgData, courses: coursesData });
};
