import { json } from '@sveltejs/kit';
import { UNSPLASH_API_KEY } from '$env/static/private';

const UNSPLASH_API_URL = `https://api.unsplash.com/search/photos?page=2&per_page=15&auto=format&fit=crop&w=2970&q=80&client_id=${UNSPLASH_API_KEY}`;

// API to fetch photos from Unsplash
export async function POST({ request }) {
  const body = await request.json();
  const { searchQuery } = body;

  const query = searchQuery || 'rocks';

  try {
    const response = await fetch(`${UNSPLASH_API_URL}&query=${encodeURIComponent(query)}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Unable to fetch photos from Unsplash API');
    }

    const data = await response.json();

    return json({
      success: true,
      photos: data.results
    });
  } catch (error) {
    console.error(error);

    return json(
      { success: false, message: 'Error fetching photos from Unsplash' },
      { status: 500 }
    );
  }
}
