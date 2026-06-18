# ClassFlow — Sri Lanka Market Roadmap

Strategic product roadmap aligned to the Sri Lankan tuition market: solo tutors, academies, and institutes.

**Last updated:** June 2026  
**Status:** Phase 1.5 complete; Phase 2A in progress

---

## 1. Market segments

| Segment | Typical size | How they operate | What they pay for | ClassFlow fit |
|--------|----------------|------------------|-------------------|---------------|
| **Solo tutor** | 30–150 students | Home/small class, one subject, cash at door, WhatsApp to parents | Speed + fee control | Strong (Phase 1) |
| **Small academy** | 150–800 | 2–5 teachers, theory + revision + paper classes, admission fee | Organization + parent trust + certificates | Very strong (Phase 1.5) |
| **Mid institute** | 800–2,500 | Multiple halls, front desk, branches, term exams | Staff workflows + branch reports + roles | Partial (Sprint 5–6) |
| **Large institute brand** | 2,500+ | Enterprise process, brand reputation, optional online pay later | Dashboard + integrations | Future (Phase 3+) |

**Product truth:** One codebase, three modes — solo (simple), academy (owned brand + courses), tuition building (halls + visiting teachers).

See [SL_TUITION_OPERATING_MODEL.md](./SL_TUITION_OPERATING_MODEL.md) for course naming and the two money flows (tuition vs hall rent).

---

See [SL_EDUCATION_SECTORS.md](./SL_EDUCATION_SECTORS.md) for the full sector map (IT, maritime, gemology, counselling, NVQ, etc.).

---

## 1b. Sri Lankan course model

Classes are **A/L Combined Maths — Theory**, not "Grade 11 Maths". Tuition buildings: students pay **teachers**, teachers pay **building admin** for hall slots.

---

## 2. Sri Lankan market priorities

### Must-have (daily pain)

1. Fast attendance in weak-signal halls
2. Cash fee recording + digital receipt
3. Defaulter list + WhatsApp reminder
4. Parent visibility (attendance %, fee status)
5. Trilingual UI (Sinhala / Tamil / English)

### High-value wedge (academy / institute)

6. Admission + monthly + material/exam charges
7. Pro-rata / mid-month enrollment rules
8. Split payments across multiple dues
9. Certificates with eligibility rules
10. Certificate PDF + official share

### Important but not first

11. QR attendance (large classes)
12. Online payments (PayHere) — later for some institutes
13. Payroll / revenue share — institute-only
14. AI messaging — accelerator, not adoption driver

### Competitive parity

15. Parent full portal, notices, campaigns
16. SMS fallback (Notify.lk)
17. Exam registration, hall booking, model-exam packages

---

## 3. Phase map (SL-adjusted)

| Phase | Focus | SL market goal | Status |
|-------|--------|----------------|--------|
| **0** | Foundation | Product structure, UI, Supabase, routing | ✅ Done |
| **1** | Solo MVP | Replace paper for individual tutors | ✅ Done |
| **1.5** | Academy foundation | Catalog, fees, ledger, certification rules | ✅ Done |
| **2A** | Trust & daily ops | Cert PDF, absence alerts, offline attendance, comms log | 🔄 In progress |
| **2B** | Scale attendance | QR check-in, campaign composer, SMS fallback | Planned |
| **2C** | Parent stickiness | Parent portal lite + receipt/certificate timeline | Planned |
| **3** | Institute ops | Roles, branches, halls, conflict detection, branch reports | Planned |
| **4** | Monetization expansion | PayHere, payroll-style reports, AI drafts, BrainCoin | Planned |

---

## 4. Sprint plan (2-week sprints, SL-optimized)

### Sprint 1 — Certificate documents ✅ Shipped

**Goal:** Institute can issue, download, re-share verifiable certificate documents.

| Item | Status | Acceptance criteria |
|------|--------|---------------------|
| Certificate templates | ✅ | Workspace signatory + completion/achievement wording + footer (`/settings/certificate-templates`) |
| PDF export/download | ✅ | jsPDF landscape certificate; Download / Reprint on certificate detail |
| Reprint history | ✅ | `certificate_prints` table; history on certificate detail |
| Revoke flag | ✅ | `revoked_at` on certificate; blocks WhatsApp share; REVOKED watermark on PDF |

**Exit:** Academy/institute issues official PDF certs parents can save and verify.

---

### Sprint 2 — Daily communication + offline ✅ Shipped

**Goal:** Absence and fee comms are auditable; classes run in poor-signal halls.

| Item | Status | Acceptance criteria |
|------|--------|---------------------|
| Absence alerts | ✅ | After save, composer opens for absent students; WhatsApp send with template |
| Offline attendance queue | ✅ | Marks queue on offline/network failure; sync banner + Sync now |
| Message composer | ✅ | Edit message before send; skip per student |
| Delivery log | ✅ | `message_deliveries` table; sent/failed/skipped + retry |

**Exit:** Teacher can mark attendance offline and parents get same-day absence notice.

---

### Sprint 3 — Parent trust layer ✅ Shipped

**Goal:** Parent self-service reduces front-desk load.

| Item | Status | Acceptance criteria |
|------|--------|---------------------|
| Parent OTP login | ✅ | Phone OTP via RPC; pilot code shown until Notify.lk SMS |
| Child dashboard | ✅ | Attendance %, fee status, outstanding amount |
| Receipt + certificate timeline | ✅ | Combined timeline on parent child dashboard |

**Exit:** Parent checks attendance and fees without calling the institute.

---

### Sprint 4 — Fast attendance at scale ✅ Shipped

**Goal:** Large classes mark attendance in under 3 minutes.

| Item | Status | Acceptance criteria |
|------|--------|---------------------|
| QR student ID | ✅ | Per-student QR card at `/students/[id]/qr-card` |
| Class scanner flow | ✅ | Camera scan at `/classes/[id]/scan` marks present |
| Fast check-in pipeline | ✅ | Scan → validate roster → mark present + recent scan log |

**Exit:** O/L/A/L size classes use QR instead of manual taps.

---

### Sprint 5 — Institute operations v1

**Goal:** Non-owner staff can safely operate daily workflows.

| Item | Acceptance criteria |
|------|---------------------|
| Role model | Owner / admin / teacher / front-desk |
| Permission gates | Fees, certs, settings restricted by role |
| Staff onboarding | Invite or assign role per workspace member |

**Exit:** Front desk records payments; teacher cannot change workspace settings.

---

### Sprint 6 — Multi-location

**Goal:** Multi-branch ops visible in one dashboard.

| Item | Acceptance criteria |
|------|---------------------|
| Branch + hall management | CRUD branches and halls |
| Timetable conflict detection | Warn on double-booked hall |
| Branch reports | Collection and attendance by branch/hall |

**Exit:** Institute owner sees per-branch monthly collection.

---

### Sprint 7 — Revenue expansion (optional)

**Goal:** Phase 3/4 technical readiness.

| Item | Acceptance criteria |
|------|---------------------|
| PayHere spike | Architecture draft + pilot with one institute |
| AI message assistant | Trilingual draft behind feature flag |

**Exit:** Online pay path documented; AI pilot optional.

---

### Sprint 8 — SL course model + teacher scope

**Goal:** Classes match how Sri Lankan teachers actually name courses.

| Item | Acceptance criteria |
|------|---------------------|
| Course templates | A/L, O/L, scholarship presets in create-course UI |
| `exam_level` + `session_type` columns | Migrate off grade-as-class-identity |
| Teacher-scoped data (building mode) | Teachers see only their students/fees in institute workspace |

**Exit:** Institute building demo shows visiting-teacher courses, not "Grade 11".

---

### Sprint 9 — Hall rent ledger

**Goal:** Building admin tracks teacher slot fees separately from tuition.

| Item | Acceptance criteria |
|------|---------------------|
| Hall bookings | Teacher claims weekday slot in a hall |
| Rent invoices | Monthly hall rent due from each teacher |
| Admin rent dashboard | Occupancy + rent collection vs tuition (hidden from admin by default) |

**Exit:** Building owner sees who owes hall rent; teachers still own student fee books.

---

### Sprint 10 — Building timetable board

**Goal:** Beautiful hall-grid home for tuition buildings.

| Item | Acceptance criteria |
|------|---------------------|
| Timetable board | Hall × time grid with teacher + course names |
| Conflict resolution | Admin resolves double-booked slots |
| Teacher invite flow | Visiting teacher onboarding in 5 minutes |

**Exit:** Matches physical notice-board at a Colombo tuition tower.

---

## 5. Go-to-market

### Solo tutors (volume)

- **Message:** Stop the fee book. Know who paid in 10 seconds.
- **Channel:** Facebook tuition groups, teacher referrals
- **Pricing:** Free up to ~30 students
- **Activation:** First class + attendance + payment in 24h

### Small academies (revenue)

- **Message:** Admission + monthly + material + certificates + defaulter WhatsApp in one app.
- **Channel:** Direct demos, pilot case study
- **Pricing:** Starter LKR 1,000–1,500/mo (validate)
- **Activation:** Invoices paid in-app + term-end certificate issued

### Mid institutes (expansion)

- **Message:** Front desk registers and collects safely; owner sees branch reports.
- **Channel:** Founder-led sales, 1–2 pilots
- **Pricing:** Institute tier LKR 3,500–5,000/mo
- **Activation:** Staff daily usage + branch monthly report

---

## 6. Competitive positioning

> **The Sri Lankan tuition operations app: cash fees, pro-rata, admission/material/exam billing, defaulters, and certificates — built for local teacher workflow.**

| Alternative | Weakness in SL | ClassFlow advantage |
|-------------|----------------|---------------------|
| Paper + Excel | No parent comms, no audit | Receipts + WhatsApp + history |
| Classplus (India) | Online-pay heavy | Cash-first + local billing rules |
| Generic school ERP | Too heavy | Fast mobile UX, tuition-specific |
| Facebook + WhatsApp only | No structured data | Structured ops + same channel |

---

## 7. What not to do yet

1. Prioritize online payments before cash workflow dominates sales demos
2. Over-build AI before offline attendance + parent portal prove retention
3. Expose full institute complexity to solo users
4. Delay parent visibility — major trust lever in SL
5. Skip SMS fallback planning for non-WhatsApp parents

---

## 8. Mode-aware UX (planned)

| Workspace type | UI surface |
|----------------|------------|
| `solo` | Students, classes, attendance, fees, reports — hide catalog/cert admin |
| `academy` | + Catalog, admission fees, material/exam charges, certificates |
| `institute` | + Roles, branches, halls (as shipped) |

---

## 9. Current build alignment

**Ahead of original plan:** Fee depth, pro-rata, split pay, material/exam charges, certification + eligibility + WhatsApp share.

**Best sequence now:**

1. Certificate document pipeline (template / PDF / reprint / revoke) — **Sprint 1**
2. Offline + QR attendance — **Sprints 2–4**
3. Communication automation + parent portal — **Sprints 2–3**

See [PHASE_PLAN.md](./PHASE_PLAN.md) for technical phase details.
