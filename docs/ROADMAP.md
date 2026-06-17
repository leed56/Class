# ClassFlow Roadmap

This is the single, consolidated roadmap for ClassFlow. It captures the product vision, the
current build status, the full phased plan (BrainCoin removed), and the recommended execution
order with rationale. For phase-by-phase detail see [`PHASE_PLAN.md`](PHASE_PLAN.md); for screen
lists see [`UI_SCREENS.md`](UI_SCREENS.md).

## Product vision

ClassFlow is a premium, mobile-first tuition class management SaaS for Sri Lankan teachers and
institutes. It replaces the paper register and fee book: students, classes, attendance, monthly
cash fees, receipts, reports, and parent communication — trilingual-ready (English / Sinhala /
Tamil).

The active app is the Expo React Native client in `expo-client/`. The `mobile/` Flutter folder is
a deprecated exploration scaffold and should not receive feature work.

## Stack

- App: Expo React Native + TypeScript, Expo Router (`expo-client/`)
- Backend: Supabase (Postgres, Auth, RLS, Storage, Edge Functions) — hosted, wired via `expo-client/.env`
- Web: ships today via `react-native-web` (Expo web); a dedicated dashboard comes in Phase 3
- Later integrations: WhatsApp (ReachWA), SMS fallback (Notify.lk), payments (PayHere), builds (EAS)

## Current status

Phase 1 (Solo Teacher MVP) is largely implemented in `expo-client/`:

- Auth + onboarding (workspace/tenant creation), home dashboard
- Students (list, add, edit, profile)
- Classes (list, create, edit, detail, enrollment)
- Attendance (manual sessions)
- Fees (invoices, record payment, receipts) with WhatsApp receipt/reminder sharing
- Reports hub (with CSV export and VAT report)
- Settings (subjects, communication, subscription, launch checklist)

Tooling: dev environment is set up, and `lint` / `typecheck` are green.

## Phased plan

| Phase | Goal | Status |
| --- | --- | --- |
| 0 — Foundation | Strong base: docs, design tokens, navigation, schema draft, app shell | Done |
| 1 — Solo Teacher MVP | Replace paper register and fee book | Largely done |
| 1.5 — Hardening & Localization | Make the MVP safe for real teachers | Next |
| 2 — Scale & Communication | Make the app sticky for parents and faster attendance | Planned |
| 3 — Institute Tier | Support multi-teacher institutes and a web dashboard | Planned |
| 4 — AI Assistance Layer | Cut admin/communication time with AI (no BrainCoin) | Planned |

### Phase 1.5 — Hardening & Localization

- Supabase RLS hardening so each teacher only ever sees their own workspace data
- Full trilingual UI (English / Sinhala / Tamil) through a shared i18n layer
- Consistent empty, loading, and error states across every screen
- Input validation and friendly error messages on all forms

### Phase 2 — Scale & Communication

- WhatsApp fee reminders and absence alerts (builds on `src/lib/whatsapp.ts`)
- Announcement broadcasts; SMS fallback via Notify.lk
- QR/barcode student ID attendance
- Offline attendance cache + sync on reconnect
- Parent portal MVP (timetable, attendance %, fee status)

### Phase 3 — Institute Tier

- Multi-teacher support and front-desk staff role
- Multi-hall scheduling, branch management, timetable conflict detection
- Online tuition fee collection (PayHere), payroll-base reports
- Web dashboard

### Phase 4 — AI Assistance Layer

- Claude-drafted trilingual parent messages (reminders, absence notes, announcements)
- Student attendance and fee summaries
- Auto-drafted progress notes from attendance and payment history
- Tone and language controls; every AI draft is editable before it is sent

## Recommended execution order

Sequenced by dependency and risk: protect real users first, build foundations before more surface
area, and leave the most invasive work until the data model is stable.

1. **Merge the open setup PRs** so all future branches start from a clean `main`.
2. **Supabase RLS hardening** — security-critical and self-contained. Real teacher data already
   lives in a shared Postgres; verify policies on `workspaces`, `workspace_members`, `students`,
   `classes`, `enrollments`, attendance, invoices, payments, and receipts so no teacher can read or
   write another teacher's data.
3. **Trilingual i18n pass** — cheap now, expensive later. Adding the i18n layer before more screens
   means every new screen is translatable from day one, and it unblocks Phase 4 language controls.
4. **Stabilize Phase 1 edges** — consistent empty/loading/error states and form validation. Small,
   high-value polish that also surfaces RLS error-handling gaps.
5. **Phase 2 communication (WhatsApp campaigns first)** — closest, highest-retention feature; the
   helper already exists and benefits directly from i18n.
6. **Phase 2 attendance (QR, then offline cache + sync)** — offline sync is the most invasive change
   (local store + conflict resolution), so do it after the model and RLS are locked down.
7. **Phase 3 — Institute tier** — builds on a hardened RLS model.
8. **Phase 4 — AI assistance** — builds on stable data and i18n.

### Why this order

- Security before features: RLS protects data already in use.
- Foundations before surface area: i18n and stable states get harder to retrofit over time.
- Reuse what exists: the WhatsApp helper makes reminder campaigns a fast win.
- Riskiest/most invasive last within a phase: offline sync after the model stabilizes.

## Build order checklist (engineering)

1. Dashboard shell and design system
2. Students module
3. Classes module
4. Attendance module
5. Fees and payments module
6. Reports module
7. Settings and tenant profile
8. Supabase RLS hardening
9. Trilingual localization pass
10. Offline and messaging enhancements
11. AI assistance layer
