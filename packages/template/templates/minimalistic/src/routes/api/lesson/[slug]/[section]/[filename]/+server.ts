import fs from 'fs';
import path from 'path';
import { compile } from 'mdsvex';

export async function GET({ params }) {
  const { slug, section, filename } = params;

  try {
    // Construct the lesson file path
    const lessonFilePath = path.join(
      process.cwd(),
      `/src/lib/courses/${slug}/${section}/${filename}`
    );
    const lessonContent = fs.readFileSync(lessonFilePath, 'utf-8');

    // Compile the markdown content into a Svelte component using mdsvex
    const compiledContent = await compile(lessonContent);

    // Return the compiled content as JSON
    return new Response(JSON.stringify({ content: compiledContent.code }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(`Error loading lesson: ${error.message}`, { status: 500 });
    }
  }
}
