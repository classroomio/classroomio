import fs from 'fs';
import path from 'path';
import { compile } from 'mdsvex';

export async function GET({ params }) {
  const { slug, filename } = params;

  try {
    const lessonFilePath = path.join(process.cwd(), `/src/lib/courses/${slug}/${filename}`);
    const lessonContent = fs.readFileSync(lessonFilePath, 'utf-8');

    const compiledContent = await compile(lessonContent);

    // Return the compiled content as JSON
    return new Response(JSON.stringify({ content: compiledContent.code }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(`Error loading lesson: ${error.message}`, { status: 500 });
  }
}
