export type AudienceMemberStatus = 'active' | 'pending' | 'expired' | 'revoked';

export function deriveAudienceMemberStatus(
  profileId: string | null,
  invite: { acceptedAt: string | null; isRevoked: boolean; expiresAt: string } | undefined
): AudienceMemberStatus {
  if (profileId) {
    return 'active';
  }
  if (invite?.acceptedAt) {
    return 'active';
  }
  if (!invite) {
    return 'pending';
  }
  if (invite.isRevoked) {
    return 'revoked';
  }
  if (new Date(invite.expiresAt) <= new Date()) {
    return 'expired';
  }
  return 'pending';
}
