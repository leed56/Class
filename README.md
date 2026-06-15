# ClassFlow

Premium mobile-first tuition class management SaaS for Sri Lankan teachers and institutes.

## Product focus

ClassFlow helps Sri Lankan tuition teachers manage students, classes, attendance, monthly fees, cash payments, receipts, and parent communication.

The first build focuses on the **teacher mobile app**. Web dashboards, institute management, online payments, QR attendance, and AI features come later.

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

- Mobile app: Flutter
- Backend: Supabase Postgres, Auth, RLS, Storage, Edge Functions
- Web dashboard: React/Vite later
- Messaging: ReachWA / WhatsApp later
- SMS fallback: Notify.lk later
- Payments: PayHere later

## Repository structure

```txt
mobile/                 # Flutter teacher mobile app
docs/                   # Product, UI, architecture, and planning docs
supabase/               # SQL migrations, seed data, Edge Functions later
.github/workflows/      # CI later
```

## Documentation

- [Phase Plan](docs/PHASE_PLAN.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [UI Screens](docs/UI_SCREENS.md)
- [Design System](docs/DESIGN_SYSTEM.md)

## Current status

Planning foundation started. Next step is to create the Flutter mobile scaffold under `mobile/` and implement the premium dashboard shell.
