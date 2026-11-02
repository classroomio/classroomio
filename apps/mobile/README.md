# ClassroomIO mobile app

The iOS and Android app for ClassroomIO, built with Expo. It talks to the same API as the dashboard.

## What you need

- A Mac with Xcode for iOS, or Android Studio with an emulator for Android.
- Node.js 24 (the version in the repo's `.nvmrc`) and pnpm 10.
- A free [Expo account](https://expo.dev/signup).
- An Apple Developer account, only if you want to run the app on a real iPhone.

## Set up

1. **Run the API locally.** Follow steps 1 to 8 of [Local Setup](../../README.md#local-setup) in the root README. You only need the API (`pnpm api:dev`); the dashboard is optional. The API runs at `http://localhost:3002` with demo data.

2. **Build the shared packages** from the repo root, if you haven't already:

   ```bash
   pnpm build
   ```

3. **Create an Expo project.** On [expo.dev](https://expo.dev), open **Projects**, create a project named `classroomio` (it must match `slug` in `app.config.ts`) and copy its ID.

4. **Create `apps/mobile/.env`** from the example:

   ```bash
   cd apps/mobile
   cp .env.example .env
   ```

   Fill it in:

   ```bash
   APP_ID="com.yourname.classroomio"      # your own ID, not com.classroomio.app; dev builds add .dev
   APP_VARIANT="development"
   EAS_PROJECT_ID="<the ID from step 3>"
   EXPO_PUBLIC_API_URL="http://localhost:3002"
   ```

   On the Android emulator, use `http://10.0.2.2:3002`, which is how the emulator reaches your Mac.

5. **Run the app** in the iOS Simulator or Android emulator:

   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

   The first run builds the app, which takes a few minutes. After that, Metro reloads your changes.

6. **Sign in** with a demo account. The password for all of them is `123456`.

   | Account            | Role                      |
   | ------------------ | ------------------------- |
   | `student@test.com` | Student                   |
   | `admin@test.com`   | Admin, with the Teach tab |

## Run on a real iPhone

1. Set `EXPO_PUBLIC_API_URL` to your Mac's local network address instead of `localhost`, for example `http://192.168.1.20:3002`. Your phone and Mac must be on the same Wi-Fi.
2. The first time, build and install the app once so Apple registers your bundle ID with push notifications. Find your phone's ID with `xcrun devicectl list devices`.

   ```bash
   pnpm build:ios:dev
   DEVICE_ID=<your phone's ID> pnpm install:ios:dev
   ```

3. After that, run it directly:

   ```bash
   npx expo run:ios --device
   ```

Restart Metro whenever you change `EXPO_PUBLIC_API_URL`.

## Use a different server

You can change the server from the sign-in screen: tap **Change** at the bottom. A server chosen there overrides `EXPO_PUBLIC_API_URL` until you switch back to the default. To build the app against a server by default, set `EXPO_PUBLIC_API_URL` in `.env`.

## Check your changes

```bash
npx tsc --noEmit
```

## Build for TestFlight and Google Play

1. Create `apps/mobile/.env.production` with the same variables as `.env`, using `APP_VARIANT="production"` and your production API in `EXPO_PUBLIC_API_URL`.
2. Build and upload:

   ```bash
   pnpm deploy:ios       # builds on your Mac and uploads to TestFlight
   pnpm deploy:android   # builds on your Mac and uploads to the Play internal track
   ```

   `pnpm build:ios` and `pnpm build:android` only build, into `apps/mobile/build/`.

For code conventions and how the app is organised, read [AGENTS.md](AGENTS.md).
