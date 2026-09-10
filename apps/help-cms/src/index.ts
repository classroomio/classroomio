/**
 * @cio/help-cms — GitHub OAuth proxy for the Sveltia CMS admin UI at
 * classroomio.com/help/admin. Exchanges an OAuth `code` for an access token
 * server-side, since GITHUB_CLIENT_SECRET can never reach the browser.
 * Implements the standard Decap/Sveltia CMS OAuth-provider popup handshake.
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

  // Fails open when Referer/Origin is missing (can happen legitimately) — this
  // is defense-in-depth only; GitHub's own write-access check is the real boundary.
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

  // Secure is skipped over plain HTTP (local `wrangler dev`) — some browsers
  // (e.g. Brave) won't store a Secure cookie on http://localhost.
  const secureAttr = url.protocol === 'https:' ? 'Secure; ' : '';
  const headers = new Headers({ Location: authorizeUrl.toString() });
  headers.append(
    'Set-Cookie',
    `${STATE_COOKIE}=${state}; HttpOnly; ${secureAttr}SameSite=Lax; Max-Age=600; Path=/callback`
  );

  return new Response(null, { status: 302, headers });
}

function renderHandshakePage(message: string): Response {
  // Waits up to 300ms for the opener's echo (standard Decap/Sveltia handshake),
  // else falls back to posting with '*' for CMS builds that skip that step.
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
