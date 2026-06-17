# ClassFlow

Mobile-first tuition class management SaaS for Sri Lankan teachers. The active app is the Expo React Native client in `expo-client/` (runs on iOS/Android and on the web via `react-native-web`). The `mobile/` Flutter folder is a deprecated exploration scaffold and should not receive feature work. Backend is a hosted Supabase project (Auth + Postgres); SQL lives in `supabase/`.

## Cursor Cloud specific instructions

- All work happens in `expo-client/`. Standard commands are in `expo-client/package.json` (`start`, `web`, `lint`, `typecheck`, `build:web`).
- Supabase is a remote hosted project. Connection vars are committed in `expo-client/.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`), so auth and data work out of the box with no local DB. If those vars are missing/placeholder, the app falls back to a read-only "demo mode" (`isSupabaseConfigured` in `src/lib/supabase.ts`); a working `.env` is required for the real login/registration flow.
- Email confirmation is disabled on the Supabase project, so signing up returns a session immediately and lands the user in the app — no inbox step needed when testing the registration flow.
- To run/demo the app, use the web target: `npm run web` (Metro dev server on `http://localhost:8081`). The first request triggers a Metro web bundle that can take 30-60s; the page shows a "Loading ClassFlow" spinner until the bundle is ready, then redirects to the login screen.
- `npm run lint` currently reports pre-existing errors/warnings (mostly `react-hooks/set-state-in-effect` and unused-var warnings) in committed code. These are not environment issues; do not treat a non-zero lint exit as a setup failure.
- Adding a student requires a parent phone and an explicit "capture consent" step before "Save Student" will succeed — this is intended validation, not a bug.
