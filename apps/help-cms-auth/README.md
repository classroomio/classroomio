# @cio/help-cms-auth

GitHub OAuth proxy for the Sveltia CMS admin UI served at `classroomio.com/help/admin`. Sveltia's `github` backend needs a small server-side hop to exchange an OAuth `code` for an access token without ever putting the OAuth App's client secret in the browser — this Worker is that hop.

It implements the standard Decap/Sveltia CMS OAuth-provider contract: `GET /auth` starts the GitHub OAuth flow, `GET /callback` completes it and hands the token back to the CMS via `window.postMessage`. See `src/index.ts` for the full flow.

## One-time setup

1. **Register a GitHub OAuth App** (a repo/org admin does this): GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: `https://classroomio.com/help`
   - Authorization callback URL: `https://cio-help-cms-auth.<your-account>.workers.dev/callback`
2. Set the client ID in `wrangler.toml` (`[vars] GITHUB_CLIENT_ID`) — it's public, safe to commit.
3. Set the client secret as a Worker secret — **never commit it**:
   ```
   wrangler secret put GITHUB_CLIENT_SECRET
   ```
4. Deploy:
   ```
   pnpm --filter @cio/help-cms-auth deploy
   ```
   (Or `pnpm run deploy` from this directory.) There is intentionally no CI deploy for this Worker, consistent with how `apps/help` itself is deployed — locally via `wrangler deploy`, or via Cloudflare's connected-repo integration.
5. Point `apps/help/public/admin/config.yml`'s `backend.base_url` at this Worker's `*.workers.dev` URL.

## Access model

Anyone who authenticates through this proxy gets a GitHub token scoped `repo`. Sveltia's `github` backend then pushes branches directly into `classroomio/classroomio` using that token, so only people who already have push access to the repo (i.e. are GitHub collaborators) can actually open a PR this way. Granting/revoking CMS access is done by managing repo collaborators, not by anything in this Worker.
