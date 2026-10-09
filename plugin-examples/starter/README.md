# ClassroomIO Starter Reference Plugin

This is a canonical starter plugin for ClassroomIO. It demonstrates how external plugins interact with ClassroomIO through public contracts.

## Rules of Engagement

1. **Sandboxed Runtime**: Runs in an isolated cross-origin `<iframe>`.
2. **Public SDK**: Interacts with ClassroomIO strictly via `@classroomio/plugin-sdk`.
3. **Semantic Styles**: Styled using `@classroomio/plugin-design`.
4. **Zero Internal Imports**: Does not import `$lib/*`, `$features/*`, or any `@cio/*` internal package.

## Development

```bash
pnpm install
pnpm dev
```

## Production Build

```bash
pnpm build
```

Build outputs static assets to `dist/`, which are published and served via ClassroomIO's plugin CDN.
