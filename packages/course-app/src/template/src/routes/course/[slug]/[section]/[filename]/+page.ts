import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
  try {
    const { slug, section, filename } = params;
    if (!slug || !section || !filename) {
      throw new Error('Missing required path parameters');
    }

    const _filename = filename.split('.')[0];
    const content = await import(`../../../../../courses/${slug}/${section}/${_filename}.md`);

    return {
      content: content.default,
      meta: content.metadata
    };
  } catch (e) {
    console.error('error', e);
    error(404, `${e}`);
  }
};
