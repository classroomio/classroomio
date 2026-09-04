/**
 * @cio/help-cms-auth — GitHub OAuth proxy for the Sveltia CMS admin UI at
 * classroomio.com/help/admin. Sveltia's `github` backend needs a small
 * server-side hop to exchange an OAuth `code` for an access token without
 * exposing the OAuth App's client secret to the browser; this Worker is that
 * hop, adapting the standard Decap/Sveltia CMS OAuth-provider contract
 * (same popup handshake as netlify-cms-oauth-provider-node / sveltia-cms-auth).
 *
 * Flow:
 *   1. The CMS opens a popup at GET /auth.
 *   2. /auth redirects to GitHub's OAuth authorize URL, with a `state` value
 *      also stashed in a short-lived cookie (CSRF check — this Worker holds
 *      no server-side session store).
 *   3. GitHub redirects the popup back to GET /callback?code=...&state=...
 *   4. /callback verifies `state` against the cookie, exchanges `code` for an
 *      access token using GITHUB_CLIENT_SECRET (never sent to the browser),
 *      and returns an HTML page whose inline script completes the
 *      window.postMessage handshake the CMS is waiting on.
 */

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  /** Comma-separated list of origins allowed to initiate /auth. */
  ALLOWED_ORIGINS?: string;
}

const STATE_COOKIE = 'help_cms_auth_state';
const OAUTH_SCOPE = 'repo';

function randomState(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  for (const piece of cookieHeader.split(';')) {
    const eq = piece.indexOf('=');
    if (eq === -1) continue;

    const key = piece.slice(0, eq).trim();
    if (key === name) return piece.slice(eq + 1).trim();
  }

  return null;
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;

  // Referer/Origin can legitimately be missing (stripped by a browser privacy
  // setting or extension) even for a real, same-user popup navigation. This
  // check is defense-in-depth, not the actual security boundary — that's the
  // OAuth exchange itself plus GitHub requiring repo write access — so fail
  // open when there's nothing to check, and only block a referer/origin that
  // is present and clearly doesn't match.
  const referer = request.headers.get('referer') ?? request.headers.get('origin');
  if (!referer) return true;

  return allowed.some((origin) => referer.startsWith(origin));
}

function handleAuth(request: Request, env: Env): Response {
  if (!isAllowedOrigin(request, env)) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const state = randomState();
  const redirectUri = `${url.origin}/callback`;

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', OAUTH_SCOPE);
  authorizeUrl.searchParams.set('state', state);

  // `Secure` is skipped for plain-HTTP requests (local `wrangler dev`) —
  // some browsers (e.g. Brave) won't store a Secure cookie set over
  // http://localhost, which silently breaks every callback's state check
  // locally. In production this Worker is always served over https, so
  // Secure is kept there.
  const secureAttr = url.protocol === 'https:' ? 'Secure; ' : '';
  const headers = new Headers({ Location: authorizeUrl.toString() });
  headers.append(
    'Set-Cookie',
    `${STATE_COOKIE}=${state}; HttpOnly; ${secureAttr}SameSite=Lax; Max-Age=600; Path=/callback`
  );

  return new Response(null, { status: 302, headers });
}

function renderHandshakePage(message: string): Response {
  // Always shows visible status text, on every path — a silent blank page
  // gives no signal when something (an extension, a browser privacy
  // setting) breaks postMessage or severs window.opener.
  //
  // Prefers the standard Decap/Sveltia handshake (wait for the opener to
  // echo "authorizing:github" back, then reply to the origin that echo
  // came from) but does not depend on it: if no echo arrives within
  // 300ms, it falls back to posting directly with '*' so a CMS that skips
  // the echo step still completes. Closes itself shortly after sending —
  // a popup left open past that point reads to the CMS as an aborted
  // attempt, not a successful one.
  const html = `<!doctype html>
<html>
  <body>
    <p id="status" style="font-family: sans-serif;">Completing GitHub sign-in&hellip;</p>
    <script>
      (function () {
        var statusEl = document.getElementById('status');
        var sent = false;

        function setStatus(text) {
          statusEl.textContent = text;
        }

        function sendResult(targetOrigin) {
          if (sent) return;
          sent = true;
          try {
            window.opener.postMessage(${JSON.stringify(message)}, targetOrigin);
            setStatus('Signed in. Closing this window…');
            // The CMS treats a popup that closes before its message is fully
            // processed as an aborted attempt, so give it a moment before
            // closing rather than leaving the window open indefinitely.
            setTimeout(function () {
              window.close();
            }, 250);
          } catch (err) {
            setStatus('Could not communicate with the opener window: ' + err.message);
          }
        }

        if (!window.opener) {
          setStatus('No opener window found — this page must be opened as a popup from the CMS.');
          return;
        }

        window.addEventListener(
          'message',
          function receiveMessage(e) {
            window.removeEventListener('message', receiveMessage, false);
            sendResult(e.origin);
          },
          false
        );

        try {
          window.opener.postMessage('authorizing:github', '*');
        } catch (err) {
          setStatus('Could not reach the opener window: ' + err.message);
          return;
        }

        // Fallback if the opener never echoes back (e.g. an older/different
        // CMS build that doesn't implement the reply step). Kept short —
        // the echo round-trip is near-instant when it happens at all, and a
        // long wait here risks the CMS's own popup-closed watchdog giving
        // up first.
        setTimeout(function () {
          sendResult('*');
        }, 300);
      })();
    </script>
  </body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = readCookie(request.headers.get('cookie'), STATE_COOKIE);

  if (!code || !state || !cookieState || state !== cookieState) {
    return renderHandshakePage('authorization:github:error:{"message":"Invalid or missing OAuth state"}');
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  if (!tokenResponse.ok) {
    return renderHandshakePage('authorization:github:error:{"message":"GitHub token exchange failed"}');
  }

  const body = (await tokenResponse.json()) as { access_token?: string; error?: string };

  if (!body.access_token) {
    return renderHandshakePage(
      `authorization:github:error:${JSON.stringify(JSON.stringify({ message: body.error ?? 'No access token returned' }))}`
    );
  }

  const payload = JSON.stringify({ token: body.access_token, provider: 'github' });
  const response = renderHandshakePage(`authorization:github:success:${payload}`);
  const secureAttr = url.protocol === 'https:' ? 'Secure; ' : '';
  response.headers.append(
    'Set-Cookie',
    `${STATE_COOKIE}=; HttpOnly; ${secureAttr}SameSite=Lax; Max-Age=0; Path=/callback`
  );

  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/auth') {
      return handleAuth(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/callback') {
      return handleCallback(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
} satisfies ExportedHandler<Env>;
