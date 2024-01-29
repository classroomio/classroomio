// export const load = ({ params }) => {
//   return {
//     slug: params.slug
//   };
// };

import { error } from '@sveltejs/kit';

export async function load({ params }) {
  try {
    const post = await import(`../../../blog/${params.slug}.md`);

    return {
      content: post.default,
      meta: post.metadata
      //   slug: params.slug
    };
  } catch (e) {
    throw error(404, `Could not find ${params.slug}`);
  }
}
