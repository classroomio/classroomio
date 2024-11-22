import fs from 'fs';
import path from 'path';
import { compile } from 'mdsvex';

export const load = async ({ params }) => {
  const { slug, section, filename } = params;
  console.log('params', params);
  if (!slug || !section || !filename) {
    throw new Error('Missing required path parameters');
  }

  try {
    const lessonPath = `/src/courses/${slug}/${section}/${filename}`;
    const lessonFilePath = path.join(process.cwd(), lessonPath);

    if (!fs.existsSync(lessonFilePath)) {
      throw new Error(`Lesson file not found: ${filename}`);
    }

    const lessonContent = await fs.promises.readFile(lessonFilePath, 'utf-8');

    const compiledContent = await compile(lessonContent);

    if (!compiledContent?.code) {
      throw new Error('Failed to compile lesson content');
    }

    return {
      content: JSON.stringify(compiledContent.code)
    };
  } catch (error) {
    console.error('Error loading lesson:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred while loading the lesson');
  }
};
