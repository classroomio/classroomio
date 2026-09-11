/**
 * @cio/help-cms — GitHub OAuth proxy for the Sveltia CMS admin UI at
 * classroomio.com/help/admin. Exchanges an OAuth `code` for an access token
 * server-side, since GITHUB_CLIENT_SECRET can never reach the browser.
 * Implements the standard Decap/Sveltia CMS OAuth-provider popup handshake.
 *
 * The final token is only ever released to an origin verified via the
 * browser-guaranteed `MessageEvent.origin` on the opener's echo reply — never
 * blindly broadcast with '*', and never trusted just because some origin
 * claims to be listening. That's what closes the "attacker opens the popup,
 * a real collaborator approves it, attacker's page receives the token" hole:
 * an attacker's echo still carries the attacker's real, browser-verified
 * origin, which won't match ALLOWED_ORIGINS. The Referer/Origin header
 * recorded at /auth time is only a fallback for CMS builds that skip the
 * echo step — also checked against the same allowlist, never trusted blind.
 * If neither check passes, the token is not sent.
 */

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  /** Comma-separated list of origins allowed to receive the OAuth result. */
  ALLOWED_ORIGINS?: string;
}

const STATE_COOKIE = 'help_cms_auth_state';
const OPENER_ORIGIN_COOKIE = 'help_cms_auth_opener';
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

function decodeCookieValue(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function getRequestOrigin(request: Request): string | null {
  const originOrReferer = request.headers.get('origin') ?? request.headers.get('referer');
  if (!originOrReferer) return null;

  try {
    return new URL(originOrReferer).origin;
  } catch {
    return null;
  }
}

function handleAuth(request: Request, env: Env): Response {
  const allowed = allowedOrigins(env);
  const origin = getRequestOrigin(request);

  // Best-effort only, not the real boundary — real popups often carry no
  // Referer/Origin at all (e.g. opened blank and navigated afterward). This
  // just rejects the cheap case: a Referer that IS present and clearly
  // doesn't match. The token itself is never released without the stronger,
  // header-independent check in the handshake page below.
  if (allowed.length > 0 && origin && !allowed.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  if (!env.GITHUB_CLIENT_ID) {
    return new Response('Server misconfigured: GITHUB_CLIENT_ID is not set', { status: 500 });
  }

  const url = new URL(request.url);
  const state = randomState();
  const redirectUri = `${url.origin}/callback`;

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', OAUTH_SCOPE);
  authorizeUrl.searchParams.set('state', state);

  // Secure is skipped over plain HTTP (local `wrangler dev`) — some browsers
  // (e.g. Brave) won't store a Secure cookie on http://localhost.
  const secureAttr = url.protocol === 'https:' ? 'Secure; ' : '';
  const headers = new Headers({ Location: authorizeUrl.toString() });
  headers.append(
    'Set-Cookie',
    `${STATE_COOKIE}=${state}; HttpOnly; ${secureAttr}SameSite=Lax; Max-Age=600; Path=/callback`
  );
  // Only recorded when present and already allowlisted — used strictly as a
  // fallback if the handshake page's own echo-origin check never fires.
  if (origin && allowed.includes(origin)) {
    headers.append(
      'Set-Cookie',
      `${OPENER_ORIGIN_COOKIE}=${encodeURIComponent(origin)}; HttpOnly; ${secureAttr}SameSite=Lax; Max-Age=600; Path=/callback`
    );
  }

  return new Response(null, { status: 302, headers });
}

function renderHandshakePage(message: string, allowed: string[], fallbackOrigin: string | null): Response {
  const html = `<!doctype html>
<html>
  <body>
    <p id="status" style="font-family: sans-serif;">Completing GitHub sign-in&hellip;</p>
    <script>
      (function () {
        var statusEl = document.getElementById('status');
        var sent = false;
        var allowed = ${JSON.stringify(allowed)};
        var fallbackOrigin = ${JSON.stringify(fallbackOrigin)};

        function setStatus(text) {
          statusEl.textContent = text;
        }

        // Requires a non-empty, matching allowlist — unlike the server-side
        // check, this one guards the actual token release, so a missing
        // config must fail closed, not open.
        function isAllowed(origin) {
          return !!origin && allowed.indexOf(origin) !== -1;
        }

        function sendResult(targetOrigin) {
          if (sent) return;
          if (!isAllowed(targetOrigin)) {
            setStatus('Could not verify the CMS origin for this sign-in attempt. Please try again.');
            return;
          }
          sent = true;
          try {
            window.opener.postMessage(${JSON.stringify(message)}, targetOrigin);
            setStatus('Signed in. Closing this window…');
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

        // e.origin below is set by the browser from the real sending window,
        // not something the message content can spoof — that's what makes
        // this check trustworthy where a claimed origin wouldn't be.
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

        setTimeout(function () {
          sendResult(fallbackOrigin);
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
  const fallbackOrigin = decodeCookieValue(readCookie(request.headers.get('cookie'), OPENER_ORIGIN_COOKIE));
  const allowed = allowedOrigins(env);

  const secureAttr = url.protocol === 'https:' ? 'Secure; ' : '';
  const finish = (message: string): Response => {
    const response = renderHandshakePage(message, allowed, fallbackOrigin);
    response.headers.append(
      'Set-Cookie',
      `${STATE_COOKIE}=; HttpOnly; ${secureAttr}SameSite=Lax; Max-Age=0; Path=/callback`
    );
    response.headers.append(
      'Set-Cookie',
      `${OPENER_ORIGIN_COOKIE}=; HttpOnly; ${secureAttr}SameSite=Lax; Max-Age=0; Path=/callback`
    );
    return response;
  };

  if (!code || !state || !cookieState || state !== cookieState) {
    return finish('authorization:github:error:{"message":"Invalid or missing OAuth state"}');
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
    return finish('authorization:github:error:{"message":"GitHub token exchange failed"}');
  }

  const body = (await tokenResponse.json()) as { access_token?: string; error?: string };

  if (!body.access_token) {
    return finish(
      `authorization:github:error:${JSON.stringify(JSON.stringify({ message: body.error ?? 'No access token returned' }))}`
    );
  }

  const payload = JSON.stringify({ token: body.access_token, provider: 'github' });
  return finish(`authorization:github:success:${payload}`);
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
