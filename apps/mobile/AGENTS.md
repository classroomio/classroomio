# ClassroomIO mobile

Expo SDK 58 (React Native 0.88, React 19.3, Expo Router 58, Reanimated 4) app in the ClassroomIO monorepo. Product scope: `prd/mobile-app/README.md`. UX reference: `prototypes/mobile-app/`. Neutral, light-mode primary and destructive colours follow the dashboard's theme tokens (`packages/ui/src/index.css`), not the warm marketing palette; the dark primary, dark success, the ring and warning colours (both modes), the tint colours and the `onSolid` / `artworkScrim` artwork tokens are mobile-specific. The splash and app icon keep the marketing brand blue. `skills/classroomio-design/` remains the reference for the brand mark, the notch motif and copy rules (`docs/content.md`).

## Expo has changed — do not trust training data

Before touching an Expo, EAS or React Native API, read the installed package's `.d.ts` in `node_modules` or the versioned docs at `https://docs.expo.dev/versions/v58.0.0/`. Native tabs import from `expo-router/native-tabs`. Navigation theme, `Stack`, `ThemeProvider`, `DarkTheme`, `DefaultTheme` all import from `expo-router`.

## Folder structure

- `src/app/` holds routes only. Screens compose feature components and contain no business logic beyond wiring.
- Everything else lives in `src/feature/<name>/` with these subfolders as needed: `api/` (React Query hooks and request functions), `components/`, `helpers/` (hooks and pure functions; there is no `hooks/` folder), `types/`, `constants/`.
- Code that belongs to no single feature goes in `src/feature/common/`.
- No barrel files. Import from the file that defines the thing: `@/feature/common/components/button`.

## Code rules

- `type`, never `interface`.
- No comments except a one-line note about an external constraint, or JSDoc stating a function's contract when the signature doesn't.
- Composable components in the shadcn style: a root that owns state and shares it through context, plus small parts (`AlertDialog`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogAction`). Don't prop-drill configuration into one large component.
- Sheets (`src/feature/common/components/bottom-sheet.tsx`, `option-sheet.tsx`) are presented through a ref, not an `open` prop: hold a `useRef<SheetRef>(null)` and call `ref.current?.present()`. Parts close the sheet with `useSheetDismiss()`. Work that must follow the close goes in `onDismiss`; an `OptionSheetItem`'s `onSelect` already runs after the sheet has closed. `fit` sheets size to their content and scroll past 90% of the screen. A screen shown as a native modal wraps its content in its own `BottomSheetModalProvider`, or its sheets open behind it. UI drawn over the whole window uses `useWindowInsets()`, because `useSafeAreaInsets()` inside a tab includes the tab bar. Every screen is locked to portrait. Only the lesson player's fullscreen mode turns landscape, and it renders in its own modal with its own `SafeAreaProvider`; native fullscreen in embeds and grading-answer videos stays portrait. A route shown as a native modal inside a tab stack exports `withModalSafeArea(Screen)` (`src/feature/common/components/modal-safe-area.tsx`), which gives it its own safe-area provider so `useSafeAreaInsets()` inside it excludes the tab bar. Online state for UI and queries comes from React Query's `onlineManager`, fed by `connectQueryNetworkStatus()` and re-read on every return to the foreground; read it with `useIsOffline()`. The offline sync queue and the download manager read `expo-network` directly with the same rule (`isConnected` and `isInternetReachable` not `false`), because they need the connection type or run outside React.
- React Compiler is on. Don't add `useMemo`/`useCallback`/`memo` unless profiling shows a need or the code is in a hot list cell. `useFocusEffect` callbacks are the exception: Expo Router's docs say to wrap them in `useCallback` so the effect does not re-run on every render.
- Shared values use `.get()`/`.set()`. Animations run on the UI thread with Reanimated; never `setState` per frame.
- Use `react-native-keyboard-controller` (`KeyboardAwareScrollView`, `KeyboardStickyView`) for any screen with text input. Never the core `KeyboardAvoidingView`.
- Long or growing lists use `@shopify/flash-list`. Images use `expo-image`.
- Files are kebab-case. After an early `return`, leave a blank line.

## Data

- Every API call goes through `useApi()` (`src/feature/common/components/api-provider.tsx`), a typed Hono client built from `@cio/api/rpc-types`. It sends the session cookie and `cio-org-id` automatically.
- Wrap calls with `request()` from `src/feature/common/api/request.ts`; it returns the `{ success: true }` body and throws `ApiError` otherwise. Show errors with `errorMessage()` from `src/feature/common/helpers/error-message.ts`.
- Request and response types are inferred from the API (`InferResponseType`, `InferRequestType` from `@cio/api/rpc-types`) in `feature/<name>/types/`. No hand-written DTOs, no imports from `@cio/db`, no runtime imports from `@cio/api`.
- Shared constants and validation come from `@cio/utils/...` subpath imports (for example `@cio/utils/constants/roles`).
- Server state lives in React Query. Query keys include the user id and active org id. `connectQueryAppFocus()` ties React Query's focus to `AppState`, so stale queries refetch when the app returns to the foreground, and `useRefetchOnNavigation()` in the root navigator applies the same rule after every pathname change because stack and tab screens stay mounted. Opt a query out with `refetchOnWindowFocus: false` or a longer `staleTime`.
- The API is the business-logic boundary. When the app needs data the API doesn't expose, add an endpoint to `apps/api` following the repo's validation → query → service → route layering (see the root `AGENTS.md`), never compute business rules on the device.

## Design

- Colours, type, spacing, radii and motion come from `src/feature/common/constants/`. Read colours through `useTheme()`; never hard-code hex values in components.
- Geist only, via `Text` variants (`display`, `title`, `heading`, `subheading`, `body`, `bodyStrong`, `label`, `caption`, `captionStrong`, `micro`). No monospace font anywhere. No uppercase letter-spaced labels. No pill badges around short labels; state status as plain text, optionally with an icon.
- Surfaces use `colors.surface` (white in light mode, `#171717` in dark) with thin neutral borders (`colors.border`) and at most the `elevation.raised` shadow. Row icons use `IconTile` (`src/feature/common/components/icon-tile.tsx`): neutral (`colors.muted` with an ink glyph) by default, with a `tone` (primary, success, warning, danger tint) only when the colour carries meaning, such as overdue, completed, live or next. Never colour-code plain navigation or settings rows; a settings row is toned only when its subject is itself urgent (the overdue and deadline notification categories). Notification rows lead with the actor's avatar or the course artwork and carry the category icon as a small badge, otherwise the category `IconTile`; sign out uses a `dangerTint` tile. Use `elevation.floating` only for overlays (dialogs, toasts). The `NotchCard` is the signature block for featured content; course artwork cards (Home's Continue learning and Up next) set text over the artwork with `colors.onSolid` on an `artworkScrim` gradient instead.
- Icons: `phosphor-react-native` through the `Icon` component (`weight`, default `regular`; `weight="fill"` for selected or emphasised glyphs). Import each glyph from its own file (`phosphor-react-native/src/icons/<Name>`) so the bundle does not load the whole set, and type icon props as `AppIcon`. Tab bar icons come from the bundled Phosphor icon fonts (`assets/fonts/phosphor-regular.ttf`, and `phosphor-fill.ttf` when selected). `src/feature/common/constants/phosphor-font.ts` maps glyph names to codepoints (`TAB_GLYPHS`); the font names passed to `createIconSet` must match each file's family name. `useTabIcons()` renders the glyphs to images once per launch and the root layout waits for them. The tabs layout passes them to native tabs with `renderingMode="template"` only after its screen has appeared, because iOS 26 lays out tab labels wrongly when item images are set before the tab bar is on screen.
- The org's brand colour replaces the primary colour at runtime. Use `colors.primary` and `colors.primaryText`, never the ClassroomIO blue directly.

## Copy

Plain, literal, factual. Say what the thing is and what the user can do. Never describe the screen ("below", "here you'll find", "as you scroll"). No exclamation marks, no emoji, sentence case everywhere.

## Translations

The app ships in the 12 dashboard languages (`EMAIL_LOCALES` in `@cio/utils/email`). No user-facing string is written inline: labels, placeholders, accessibility labels, dialog and toast text all come from a catalog.

- Each feature keeps its catalog in `src/feature/<name>/translations/`: `en.ts` is the source of truth, one file per locale typed `TranslatedMessages<typeof en>`, and `catalog.ts` exports `<name>Catalog` built with `defineCatalog`. Generic words (Cancel, Try again, Save) live in `commonCatalog`.
- In components: `const t = useTranslations(featureCatalog)`, then `t('key', { name })`. Counts use plural messages (`{ one, other }`, plus `few`/`many` where the language needs them) selected by `values.count`.
- Dates, times and numbers go through `useFormatters()` or `Intl` with `useLocale()`; never hand-build them in English.
- Adding a key means adding it to every locale file; the types fail the build otherwise. Translate in the register and terminology the dashboard catalogs (`apps/dashboard/src/lib/utils/translations/`) use.
- User data (course titles, lesson content, posts, names) is never translated.

## Build configuration

`app.config.ts` reads three required variables and refuses to load without them. Copy `.env.example` to `.env` (gitignored) for local development builds, and to `.env.production` for store builds (see below). EAS cloud builds set them as EAS environment variables.

- `APP_ID`: the iOS bundle identifier and Android package. Local and fork builds use their own reverse-domain ID, never the official `com.classroomio.app`.
- `APP_VARIANT`: `development`, `preview` or `production`. It sets the app name on the device and is available at runtime as `Constants.expoConfig.extra.appVariant`.
- `EAS_PROJECT_ID`: the EAS project the app builds under (`eas init` prints it). Forks create their own.

EAS: `eas.json` has `development`, `preview` and `production` profiles; each sets `APP_VARIANT`. `APP_ID` and `EAS_PROJECT_ID` live as EAS environment variables (`eas env:create`), because cloud builds don't read `.env`. EAS CLI ignores `.env` when it evaluates the config locally, so run it through `pnpm eas <command>` (for example `pnpm eas build --profile development --platform ios`), which loads `.env` first.

A new `APP_ID` must be registered on the Apple team with Push Notifications before `expo run:ios --device` can sign it. The first `pnpm build:ios:dev` (a local EAS build) does that through EAS-managed credentials; install the result with `DEVICE_ID=<udid> pnpm install:ios:dev`. After that, `npx expo run:ios --device` works directly.

Store builds read `.env.production` (gitignored) with the same variables as `.env`: `APP_VARIANT=production`, the store `APP_ID`, and `EXPO_PUBLIC_API_URL` set to the production API (empty falls back to `https://api.classroomio.com`). Keep it in sync with the EAS `production` environment. `pnpm build:ios` and `pnpm build:android` make a local EAS production build in `build/`; `pnpm deploy:ios` and `pnpm deploy:android` build and then upload it with `eas submit`: iOS to App Store Connect for TestFlight, Android to the Play internal track, which needs a Google service account key and a first upload made by hand in Play Console.

`EXPO_PUBLIC_API_URL` is inlined into the JS bundle by Metro, so restart Metro after changing it. Use the Mac's LAN address (not `localhost`) when testing on a physical phone.

Changing `APP_ID`, `APP_VARIANT`, native settings in `app.config.ts` (orientation, plugins) or adding a native module changes the native project: run `npx expo prebuild --clean`, then rebuild.

The native splash and the animated splash (`src/feature/brand/components/animated-splash.tsx`) share `src/feature/brand/constants/splash.ts`; keep the hand-off frame identical when changing either.

## Commands

```bash
npx expo install <package>   # resolves SDK-compatible versions; the workspace blocks packages published under 24h ago
npx tsc --noEmit             # typecheck
npx expo run:ios --port 8091 # dev build (ports 8081 and 8082 are used by other projects on this machine)
```

The local API runs at `http://localhost:3022` (`pnpm api:dev` from the repo root, Postgres on 55432, Redis on 56379). Demo logins use password `123456`: `admin@test.com` (admin of several orgs) and the `*-student@test.com` accounts.
