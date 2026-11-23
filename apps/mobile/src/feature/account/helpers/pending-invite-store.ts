import type { Href } from 'expo-router';
import Storage from 'expo-sqlite/kv-store';

import type { InviteKind } from '@/feature/account/types/account';

const PENDING_INVITE_KEY = 'pending-invite';

const PENDING_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export type PendingInvite = { kind: InviteKind; token: string };

/** The in-app route for an invite. `accept` makes the screen accept it without waiting for a tap. */
export function inviteHref({ kind, token }: PendingInvite, accept = false): Href {
  const params = accept ? { token, accept: '1' } : { token };
  if (kind === 'link') return { pathname: '/invite/link/[token]', params };
  if (kind === 'resource') return { pathname: '/invite/r/[token]', params };

  return { pathname: '/invite/[token]', params };
}

/** Remembers an invite opened while signed out, so it opens again once the person signs in within a day. */
export function savePendingInvite(invite: PendingInvite) {
  Storage.setItemSync(PENDING_INVITE_KEY, JSON.stringify({ ...invite, savedAt: Date.now() }));
}

/** Returns the remembered invite, if it is less than a day old, and forgets it. */
export function takePendingInvite(): PendingInvite | null {
  const stored = Storage.getItemSync(PENDING_INVITE_KEY);
  if (!stored) return null;

  Storage.removeItemSync(PENDING_INVITE_KEY);
  try {
    const invite = JSON.parse(stored) as Partial<PendingInvite> & { savedAt?: number };
    const fresh = typeof invite.savedAt === 'number' && Date.now() - invite.savedAt < PENDING_INVITE_TTL_MS;

    return fresh && invite.kind && invite.token ? { kind: invite.kind, token: invite.token } : null;
  } catch {
    return null;
  }
}

const INVITE_PATH = /\/invite\/(?:(link|r)\/)?([A-Za-z0-9_-]+)\/?$/;

/** Reads an invite from a pasted ClassroomIO invite link on any domain, or null when it is not one. */
export function parseInviteLink(value: string): PendingInvite | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let pathname: string;
  try {
    pathname = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).pathname;
  } catch {
    return null;
  }

  const match = INVITE_PATH.exec(pathname);
  if (!match?.[2]) return null;

  const kind = match[1] === 'link' ? 'link' : match[1] === 'r' ? 'resource' : 'organization';

  return { kind, token: match[2] };
}
