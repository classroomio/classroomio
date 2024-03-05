import { selectedLocale } from "$lib/utils/functions/translations";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST = (async ({ request }) => {
  try {
    const body = await request.json(); // await new Response(request.body).json();
    selectedLocale.set(body.locale);
  } catch(e) {
    selectedLocale.set('en');
  }

  return json({ status: 200 });
}) satisfies RequestHandler;