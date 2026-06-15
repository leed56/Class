# Technical Decision: Expo Client

## Decision

ClassFlow will use an Expo React Native client as the main mobile app codebase.

The active mobile app folder is:

```txt
expo-client/
```

The earlier Flutter `mobile/` scaffold is kept only as historical exploration and should not receive new feature work.

## Why Expo for ClassFlow

Expo is a strong fit for the first ClassFlow MVP because:

- Faster UI iteration for premium mobile screens
- Easier Android APK/internal preview workflow through EAS later
- Strong TypeScript support
- Good Supabase JavaScript SDK fit
- Easier sharing with web/admin React code later
- Easier integration path for WhatsApp, SMS, and API-driven features
- Works well for a mobile-first SaaS MVP

## Active stack

```txt
Mobile: Expo React Native + TypeScript
Navigation: Expo Router
Backend: Supabase
Styling: React Native StyleSheet with design tokens
Builds: EAS Build later
Web/admin: React/Vite or Next.js later
```

## Local setup direction

Use Expo's project generator locally to create native-safe project files, then keep the committed ClassFlow source structure.

Recommended command:

```bash
npx create-expo-app@latest expo-client --template default@sdk-56
```

Then copy or keep the committed ClassFlow app files inside `expo-client/`.

## Migration rule

From now on:

- New UI work goes into `expo-client/`
- Do not add new features to `mobile/`
- Supabase code should be TypeScript-first
- Shared UI tokens should live in `expo-client/src/theme/`
