import { redirect } from '@sveltejs/kit';

export const load = ({ params }) => {
  redirect(307, `/paths/${params.id}/courses`);
};
