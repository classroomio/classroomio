import { redirect, json } from '@sveltejs/kit';
import { getServerSupabase } from '$lib/utils/functions/supabase.server';

export const GET = async ({ url, getClientAddress }) => {
  const supabase = getServerSupabase();

  const token = url.searchParams.get('token');

  if (!token) {
    console.error('No verification token provided');
    return json(
      {
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Verification token is required'
      },
      { status: 400 }
    );
  }

  // Get client IP for audit trail
  const clientIP = getClientAddress();

  try {
    // Use secure verification function
    const { data: verificationResult, error: verificationError } = await supabase.rpc(
      'verify_email_with_token',
      {
        token_input: token,
        user_ip: clientIP
      }
    );

    if (verificationError) {
      console.error('Database error during verification:', verificationError);
      throw redirect(307, '/verify-email-error?error=database_error');
    }

    if (!verificationResult?.success) {
      console.warn('Verification failed:', {
        error: verificationResult?.error,
        message: verificationResult?.message,
        token: token?.substring(0, 8) + '...',
        ip: clientIP
      });

      // Redirect to appropriate error page based on error type
      const errorType = verificationResult?.error || 'unknown';
      throw redirect(307, `/verify-email-error?error=${errorType.toLowerCase()}`);
    }

    // Success! Get the verified profile to redirect properly
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('id')
      .eq('id', verificationResult.profile_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile lookup failed after verification:', profileError);
      throw redirect(307, '/verify-email-error?error=profile_not_found');
    }

    // Get organization for redirect
    const { data: orgMember } = await supabase
      .from('organizationmember')
      .select('organization:organization_id(siteName)')
      .eq('profile_id', profile.id)
      .limit(1)
      .single();

    const orgSiteName = orgMember?.organization?.siteName;

    console.log('Email verification successful:', {
      profileId: verificationResult.profile_id,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });

    // Redirect to success page
    if (orgSiteName) {
      throw redirect(307, `/org/${orgSiteName}?welcomePopup=true`);
    } else {
      throw redirect(307, '/?emailVerified=true');
    }
  } catch (error) {
    // If it's already a redirect, re-throw it
    if (error.status >= 300 && error.status < 400) {
      throw error;
    }

    console.error('Unexpected error during verification:', error);
    throw redirect(307, '/verify-email-error?error=unexpected');
  }
};
