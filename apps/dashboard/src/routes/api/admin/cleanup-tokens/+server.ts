import { json } from '@sveltejs/kit';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';

export async function POST({ request }) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json(
      {
        success: false,
        error: 'Unauthorized'
      },
      { status: 401 }
    );
  }

  const supabase = getServerSupabase();

  try {
    // Clean up expired tokens
    const { data: cleanupResult, error } = await supabase.rpc(
      'cleanup_expired_verification_tokens'
    );

    if (error) {
      console.error('Token cleanup failed:', error);
      return json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    console.log('Token cleanup completed:', {
      deletedTokens: cleanupResult,
      timestamp: new Date().toISOString()
    });

    return json({
      success: true,
      deletedTokens: cleanupResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
    return json(
      {
        success: false,
        error: 'Unexpected error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return json({
    service: 'email-verification-cleanup',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}
