import { compile } from 'mdsvex';

export const load = async ({ params }) => {
  const { slug, section, filename } = params;
  if (!slug || !section || !filename) {
    throw new Error('Missing required path parameters');
  }

  const _filename = filename.split('.')[0];
  const content = await import(
    `../../../../../courses/${slug}/${section}/${_filename}.md?raw`
  ).then((m) => m.default);

  const compiledContent = await compile(content);

  if (!compiledContent?.code) {
    throw new Error('Failed to compile lesson content');
  }

  const html = compiledContent.code.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  return {
    html,
    meta: compiledContent.data?.fm
  };
};
