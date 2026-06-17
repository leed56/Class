# ClassFlow

Premium mobile-first tuition class management SaaS for Sri Lankan teachers and institutes.

## Product focus

ClassFlow helps Sri Lankan tuition teachers manage students, classes, attendance, monthly fees, cash payments, receipts, and parent communication.

The first build focuses on the **teacher mobile app**. Web dashboards, institute management, online payments, QR attendance, and AI features come later.

## Active app direction

The active mobile app is now:

```txt
expo-client/
```

We are building ClassFlow with Expo React Native and TypeScript. The earlier `mobile/` Flutter scaffold is kept only as exploration and should not receive new feature work.

## MVP direction

Phase 1 ships a solo-teacher mobile MVP:

- Student registry
- Subject and class setup
- Student enrollment
- Manual attendance
- Monthly tuition fee tracking
- Cash payment recording
- Digital receipts
- Core reports
- Premium home dashboard
- Trilingual-ready UI foundation

## Planned stack

- Mobile app: Expo React Native + TypeScript
- Navigation: Expo Router
- Backend: Supabase Postgres, Auth, RLS, Storage, Edge Functions
- Web dashboard: React/Vite or Next.js later
- Messaging: ReachWA / WhatsApp later
- SMS fallback: Notify.lk later
- Payments: PayHere later
- Builds: EAS Build later

## Repository structure

```txt
expo-client/            # Active Expo teacher mobile app
mobile/                 # Deprecated Flutter exploration scaffold
docs/                   # Product, UI, architecture, and planning docs
supabase/               # SQL migrations, seed data, Edge Functions later
.github/workflows/      # CI later
```

## Documentation

- [Roadmap](docs/ROADMAP.md)
- [Phase Plan](docs/PHASE_PLAN.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [UI Screens](docs/UI_SCREENS.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Expo Technical Decision](docs/TECH_DECISION_EXPO.md)

## Current status

Expo client foundation started. The first premium dashboard screen and bottom tab structure are committed under `expo-client/`.

## Run locally

```bash
cd expo-client
npm install
npm run start
```
