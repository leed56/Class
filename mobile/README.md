# ClassFlow Mobile

Flutter teacher mobile app for ClassFlow.

## Current status

This folder contains the first Flutter source scaffold:

- App entry point
- Material app shell
- Premium light theme
- Bottom navigation
- Static Home dashboard with mock data
- Placeholder tabs for Classes, Students, Fees, and More

## Important setup note

This repo currently contains Flutter source files, but the native Flutter platform folders may still need to be generated locally.

From the repo root, run:

```bash
flutter create mobile
```

If Flutter says files already exist, keep the existing `mobile/lib` source files and allow Flutter to generate missing platform folders such as `android/`, `ios/`, `web/`, `macos/`, `windows/`, and `linux/` only as needed.

Then run:

```bash
cd mobile
flutter pub get
flutter run
```

## First screen built

The first implemented screen is:

```txt
lib/features/dashboard/presentation/screens/dashboard_screen.dart
```

It includes:

- Premium greeting hero card
- Today metrics
- Next class card
- Quick actions
- Fee collection progress
- Today's schedule

## Next implementation tasks

1. Generate native Flutter project files locally
2. Run `flutter analyze`
3. Replace static dashboard data with mock model classes
4. Build Students list and Add Student form
5. Add Supabase schema and auth setup
