# Migrating Docs from docs.classroomio.com to classroomio.com/docs

## Summary

This guide documents the configuration to serve the docs at `classroomio.com/docs` instead of `docs.classroomio.com` using Vercel rewrites with TanStack Start.

## Changes Made

### 1. Docs App Configuration (`apps/docs`)

**a) Updated `apps/docs/vite.config.ts`:**
```typescript
export default defineConfig({
  server: {
    port: 3000
  },
  base: '/docs',  // ← Added: Vite base path for asset resolution
  plugins: [
    mdx(await import('./source.config')),
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    tanstackStart(),
    react(),
    nitro({
      baseURL: '/docs'  // ← Added: Nitro base URL for server routing
    })
  ]
});
```

**b) Updated `apps/docs/src/router.tsx`:**
```typescript
export function getRouter() {
  return createTanStackRouter({
    basepath: '/docs',  // ← Added: TanStack Router base path
    defaultNotFoundComponent: NotFound,
    defaultPreload: 'intent',
    routeTree,
    scrollRestoration: true
  });
}
```

These three configurations work together:
- `base: '/docs'` - Tells Vite to prefix all asset paths with `/docs`
- `baseURL: '/docs'` - Tells Nitro to handle all routes under `/docs`
- `basepath: '/docs'` - Tells TanStack Router that routes are under `/docs`

### 2. Main Site Configuration (`apps/classroomio-com`)

**Created `apps/classroomio-com/vercel.json`**:
```json
{
  "rewrites": [
    {
      "source": "/docs/",
      "destination": "https://ciodocs.vercel.app/docs/"
    },
    {
      "source": "/docs/:path*",
      "destination": "https://ciodocs.vercel.app/docs/:path*"
    }
  ]
}
```

This proxies all `/docs/*` requests from `classroomio.com` to your docs deployment.

### 3. Cleanup

- Removed empty `apps/classroomio-com/src/routes/(redirects)/docs/` folder that would conflict with the Vercel rewrite

## How It Works

1. **User visits:** `classroomio.com/docs/home`
2. **Vercel receives:** Request for `/docs/home`
3. **Vercel rewrites to:** `ciodocs.vercel.app/docs/home`
4. **Docs app serves:** The page from its `/docs/home` route (configured with `basepath: '/docs'`)
5. **User sees:** Content at `classroomio.com/docs/home` (URL unchanged)

The key is that **both the rewrite and the docs app preserve the `/docs` path**, keeping everything aligned.

## Deployment Steps

### Step 1: Deploy/Redeploy the Docs App

The docs app needs to be built and deployed with the `basepath: '/docs'` configuration:

1. Make sure changes to `apps/docs/src/router.tsx` are committed
2. Deploy or redeploy to `ciodocs.vercel.app`
3. Vercel will automatically detect and deploy the changes

**Vercel Project Settings for Docs:**
- **Root Directory:** `apps/docs`
- **Build Command:** `pnpm build`
- **Output Directory:** `.output`
- **Domain:** `ciodocs.vercel.app`

### Step 2: Deploy/Redeploy the Main Site

The main site needs the `vercel.json` rewrite configuration:

1. Make sure `apps/classroomio-com/vercel.json` is committed
2. Deploy or redeploy to `classroomio.com`

**Vercel Project Settings for Main Site:**
- **Root Directory:** `apps/classroomio-com`
- **Build Command:** `pnpm build`
- **Output Directory:** `.svelte-kit`
- **Domain:** `classroomio.com`

### Step 3: Test

Once both are deployed:

1. ✅ Visit `classroomio.com/docs` - should show docs homepage
2. ✅ Visit `classroomio.com/docs/quickstart/signup` - should show specific doc pages
3. ✅ Check that styles and JavaScript load correctly
4. ✅ Test navigation within docs

## Architecture

```
User Request: classroomio.com/docs/quickstart/signup
       ↓
Vercel (classroomio.com) - reads vercel.json
       ↓
Rewrite to: ciodocs.vercel.app/docs/quickstart/signup
       ↓
Docs App (TanStack Start with basepath: '/docs')
       ↓
Serves: /quickstart/signup route
       ↓
User sees content at: classroomio.com/docs/quickstart/signup
```
