# ClassFlow Expo Client

Active mobile app for ClassFlow.

## Stack

- Expo React Native
- TypeScript
- Expo Router
- React Native StyleSheet design tokens
- Supabase later

## Setup

Recommended fresh local setup based on Expo documentation:

```bash
npx create-expo-app@latest expo-client --template default@sdk-56
cd expo-client
npm install
npm run start
```

If you already cloned this repo, run:

```bash
cd expo-client
npm install
npm run start
```

## Current screens

```txt
app/(tabs)/index.tsx      # Premium home dashboard
app/(tabs)/classes.tsx    # Classes placeholder
app/(tabs)/students.tsx   # Students placeholder
app/(tabs)/fees.tsx       # Fees placeholder
app/(tabs)/more.tsx       # More placeholder
```

## Current components

```txt
src/components/PremiumCard.tsx
src/components/MetricCard.tsx
src/components/QuickActionTile.tsx
src/theme/colors.ts
src/theme/spacing.ts
```

## Build direction

1. Finish premium dashboard UI
2. Build Students list and Add Student flow
3. Build Classes list and Create Class flow
4. Build Attendance flow
5. Build Fees and Record Payment flow
6. Add Supabase Auth and database repositories
7. Prepare EAS preview APK
