# ClassFlow Phase Plan

This plan builds ClassFlow in practical releases. The first priority is a polished teacher mobile app for solo Sri Lankan tuition teachers.

## Phase 0 — Foundation

Goal: create a strong base before feature coding.

### Deliverables

- Product documentation
- Mobile-first information architecture
- Flutter folder structure
- Supabase database plan
- Design system tokens
- Navigation model
- Empty/loading/error state rules

### Exit criteria

- `mobile/` Flutter app scaffold exists
- App theme is defined
- Routes are mapped
- Supabase schema draft is ready
- Dashboard UI can be built without redesigning navigation

## Phase 1 — Solo Teacher MVP

Goal: replace the teacher's paper register and fee book.

### Core users

- Solo tuition teacher
- Optional assistant/front-desk user later, but not required in MVP

### Features

- Teacher onboarding
- Teacher profile and tenant setup
- Student registry
- Subject setup
- Class template setup
- Student enrollment into classes
- Manual session attendance
- Monthly fee invoice generation
- Cash payment recording
- Digital receipt view
- Daily attendance report
- Monthly outstanding report
- Defaulter list

### Main screens

- Splash
- Language selection
- Login
- Register
- Teacher onboarding
- Home dashboard
- Students list
- Add/edit student
- Student profile
- Classes list
- Create/edit class
- Class detail
- Take attendance
- Attendance session detail
- Fees dashboard
- Record payment
- Receipt detail
- Reports hub
- Settings

### Exit criteria

- Teacher can create a class
- Teacher can register students
- Teacher can enroll students into a class
- Teacher can take attendance manually
- Teacher can record monthly cash payments
- Teacher can view outstanding students
- App is usable on small Android phones

## Phase 2 — Scale and Communication

Goal: make the app sticky through parent communication and faster attendance.

### Features

- QR/barcode student ID
- Offline attendance cache
- Sync on reconnect
- WhatsApp fee reminders through ReachWA
- WhatsApp absence alerts
- Announcement broadcasts
- SMS fallback through Notify.lk
- Parent portal MVP

### Main screens added

- QR scanner
- Offline sync queue
- Message composer
- Reminder campaign screen
- Parent portal home
- Parent receipt history

### Exit criteria

- Teacher can message parents from fee/attendance context
- Attendance can be taken even with poor hall signal
- Parent can see timetable, attendance percentage, and fee status

## Phase 3 — Institute Tier

Goal: support larger tuition institutes.

### Features

- Multi-teacher support
- Front-desk staff role
- Multi-hall scheduling
- Branch management
- Online tuition fee collection through PayHere
- Payroll base reports
- Timetable conflict detection
- Web dashboard

### Main screens added

- Institute admin dashboard
- Teacher management
- Staff management
- Hall management
- Branch dashboard
- Payroll reports
- PayHere payment status
- Timetable conflict view

### Exit criteria

- Institute owner can manage multiple teachers/classes
- Staff can register students and record payments
- Reports can be filtered by branch, teacher, hall, and subject

## Phase 4 — AI and BrainCoin Layer

Goal: connect ClassFlow to learning outcomes and BrainCoin.

### Features

- Claude-drafted trilingual parent messages
- Student attendance summaries
- Student fee summaries
- Progress notes
- BrainCoin Learning Pack assignment
- Class-to-content linking

### Main screens added

- AI message assistant
- Student progress summary
- BrainCoin content linking
- Learning pack assignment

### Exit criteria

- Teacher can send polished Sinhala/Tamil/English messages faster
- ClassFlow classes can link to BrainCoin content
- Teachers can assign learning packs to students

## Build order recommendation

1. Dashboard shell and design system
2. Students module
3. Classes module
4. Attendance module
5. Fees and payments module
6. Reports module
7. Settings and tenant profile
8. Supabase RLS hardening
9. Offline and messaging enhancements
