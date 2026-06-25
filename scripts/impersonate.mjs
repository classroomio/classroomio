#!/usr/bin/env node
/**
 * Mint a login-link token and print a URL that logs you in as a given user.
 *
 * For support/debugging only. The session it creates is stamped
 * `impersonatedBy: 'login-link'` so it's auditable.
 *
 * Config (env or edit the constants below):
 *   BETTER_AUTH_SECRET  HS256 signing secret for the target environment
 *   APP_URL             Base URL of the app, e.g. https://app.example.com
 *
 * Usage:
 *   BETTER_AUTH_SECRET=... APP_URL=https://app.example.com \
 *     node scripts/impersonate.mjs <user-uuid> <user-email> [redirect-path] [ttl]
 *
 * Examples:
 *   node scripts/impersonate.mjs 3f2a... user@acme.com
 *   node scripts/impersonate.mjs 3f2a... user@acme.com /courses 30m
 */
import { SignJWT } from 'jose';

// Load a .env file if present. Override the path with ENV_FILE=... if needed.
// Existing process.env values are NOT overwritten by the file.
try {
  process.loadEnvFile(process.env.ENV_FILE ?? new URL('../.env', import.meta.url));
} catch {
  // no .env found — fall back to real env vars / the constants below
}

// --- config (env wins; otherwise fill these in) -----------------------------
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? '';
const APP_URL = process.env.APP_URL ?? 'https://app.classroomio.com';
// ----------------------------------------------------------------------------

const [userId, email, redirect = '/', ttl = '10m'] = process.argv.slice(2);

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

if (!BETTER_AUTH_SECRET) fail('Set BETTER_AUTH_SECRET (env var or the constant in this file).');
if (!APP_URL) fail('Set APP_URL (env var or the constant in this file), e.g. https://app.example.com');
if (!userId || !email) {
  fail('Usage: node scripts/impersonate.mjs <user-uuid> <user-email> [redirect-path] [ttl]');
}
if (!redirect.startsWith('/')) fail('redirect-path must start with "/" (same-site only).');

const secret = new TextEncoder().encode(BETTER_AUTH_SECRET.trim());

const token = await new SignJWT({
  sub: userId,
  email: email.toLowerCase().trim(),
  type: 'login-link'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime(ttl)
  .sign(secret);

const base = APP_URL.replace(/\/+$/, '');
const url = `${base}/api/auth/login-link?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;

console.log(`\n  Login as: ${email} (${userId})`);
console.log(`  Expires in: ${ttl}\n`);
console.log(url);
console.log('\n  Open this URL in a fresh/incognito window to start the session.\n');
