import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';
import type { CourseMetadata, LandingPageContent } from '$lib/utils/types';

export const GET = async () => {
  const courseDirPath = path.join(process.cwd(), '/src/lib/courses/');
  const orgDirPath = path.join(process.cwd(), 'src/lib/data/home.json');
  const orgData: LandingPageContent = JSON.parse(fs.readFileSync(orgDirPath, 'utf8'));
  const countMdFiles = async (dirPath: string): Promise<number> => {
    let mdFilesCount = 0;
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        mdFilesCount += await countMdFiles(itemPath);
      } else if (item.name.endsWith('.md')) {
        mdFilesCount += 1;
      }
    }

    return mdFilesCount;
  };

  const coursesData = await Promise.all(
    fs.readdirSync(courseDirPath).map(async (courseFolder) => {
      const courseFolderPath = path.join(courseDirPath, courseFolder);
      const metadataFilePath = path.join(courseFolderPath, 'metadata.json');
      const metadata: CourseMetadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf-8'));
      const totalLessons = await countMdFiles(courseFolderPath);

      return {
        data: {
          ...metadata,
          slug: courseFolder
        },
        lessons: totalLessons
      };
    })
  );

  console.timeEnd('Async operation');

  // Return the data as JSON
  return json({ org: orgData, courses: coursesData });
};
