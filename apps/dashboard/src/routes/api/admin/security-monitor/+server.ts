import { json } from '@sveltejs/kit';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';

export async function GET({ url, request }) {
  // Simple auth check - in production this should be more robust
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
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
    // Get verification token statistics
    const { data: tokenStats, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('id, created_at, expires_at, used_at, created_by_ip, used_by_ip, email')
      .order('created_at', { ascending: false })
      .limit(100);

    if (tokenError) {
      console.error('Failed to fetch token stats:', tokenError);
      return json(
        {
          success: false,
          error: 'Database error'
        },
        { status: 500 }
      );
    }

    // Calculate stats
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent = tokenStats.filter((token) => new Date(token.created_at) > last24Hours);
    const used = tokenStats.filter((token) => token.used_at);
    const expired = tokenStats.filter((token) => new Date(token.expires_at) < now && !token.used_at);

    // Count unique IPs for anomaly detection
    const uniqueCreationIPs = new Set(tokenStats.map((t) => t.created_by_ip)).size;
    const uniqueUsageIPs = new Set(tokenStats.filter((t) => t.used_by_ip).map((t) => t.used_by_ip)).size;

    return json({
      success: true,
      stats: {
        total_tokens: tokenStats.length,
        recent_24h: recent.length,
        used_tokens: used.length,
        expired_unused: expired.length,
        unique_creation_ips: uniqueCreationIPs,
        unique_usage_ips: uniqueUsageIPs,
        success_rate: tokenStats.length > 0 ? ((used.length / tokenStats.length) * 100).toFixed(1) : 0
      },
      recent_activity: recent.slice(0, 10).map((token) => ({
        created_at: token.created_at,
        email: token.email.replace(/(.{2}).*@/, '$1***@'), // Mask email for privacy
        used: !!token.used_at,
        expired: new Date(token.expires_at) < now,
        ip: token.created_by_ip
      }))
    });
  } catch (error) {
    console.error('Security monitoring error:', error);
    return json(
      {
        success: false,
        error: 'Unexpected error'
      },
      { status: 500 }
    );
  }
}
