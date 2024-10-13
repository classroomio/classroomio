import fs from 'fs';
import path from 'path';

export async function GET({ params }) {
  const { slug, filename } = params;

  try {
    const lessonFilePath = path.join(process.cwd(), `/src/lib/courses/${slug}/${filename}`);
    const lessonContent = fs.readFileSync(lessonFilePath, 'utf-8');

    // Remove front matter
    const cleanContent = lessonContent.replace(/^---[\s\S]*?---/, '');

    return new Response(cleanContent, { status: 200 });
  } catch (error) {
    return new Response(`Error loading lesson: ${error.message}`, { status: 500 });
  }
}
