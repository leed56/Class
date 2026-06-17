# ClassFlow UI Screens

The UI direction is premium, mobile-first, fast to use inside a busy tuition class, and trilingual-ready for Sinhala, Tamil, and English.

## Design principles

1. Mobile first, not web squeezed into mobile.
2. Teacher can finish daily tasks in 1–2 taps.
3. Cash fee tracking must feel as important as attendance.
4. WhatsApp actions should be visible where they create value.
5. Every empty state must teach the next action.
6. Sinhala/Tamil text length must be supported with flexible layouts.
7. Dashboard must feel premium, calm, and trustworthy.

## MVP app navigation

Bottom navigation for Phase 1:

```txt
Home | Classes | Students | Fees | More
```

Recommended route map:

```txt
/
/auth/login
/auth/register
/onboarding/language
/onboarding/teacher-profile
/onboarding/create-first-class
/home
/classes
/classes/new
/classes/:classId
/classes/:classId/sessions/:sessionId/attendance
/students
/students/new
/students/:studentId
/fees
/fees/invoices/:invoiceId
/fees/payments/new
/reports
/settings
```

## Phase 1 — Solo Teacher MVP screens

### 1. Splash screen

Purpose: brand entry and app loading.

Content:

- ClassFlow logo
- Short line: `Smart class management for Sri Lankan teachers`
- Loading state

### 2. Language selection

Purpose: prepare trilingual app foundation.

Options:

- English
- Sinhala
- Tamil

UX rule: keep English available as default until full translations are complete.

### 3. Login screen

Purpose: teacher sign-in.

Fields:

- Phone or email
- Password / OTP later

Actions:

- Login
- Create account
- Forgot password

### 4. Register screen

Purpose: create teacher account.

Fields:

- Full name
- Phone
- Email optional
- Password
- Preferred language

### 5. Teacher onboarding

Purpose: create the first tenant.

Fields:

- Teacher/institute display name
- Class location/town
- Teaching medium defaults
- Subject focus

### 6. Home dashboard

Purpose: daily command center.

This is the most important premium screen.

#### Header

- Greeting: `Good morning, Mr. Nimal Perera`
- Date chip
- Notification icon
- Profile avatar

#### Today at a glance cards

- Classes today
- Attendance average
- Pending fees
- Collected this month

#### Next class card

- Subject
- Grade and medium
- Time
- Hall/location
- Enrolled count
- Primary action: `Take Attendance`
- Secondary action: QR icon later

#### Fee collection overview

- Collected vs outstanding
- Monthly progress ring or clean progress bar
- Tap to open fees dashboard

#### Today's schedule

- Time
- Subject
- Grade
- Status: upcoming / in progress / completed

#### Quick actions

- Add student
- Create class
- Record payment
- Send message

#### Smart alerts

- `12 students have pending fees`
- `3 students absent in last session`
- `Monthly invoices are ready`

### 7. Students list

Purpose: search and manage students.

Content:

- Search bar
- Filter chips: grade, medium, class, fee status
- Student cards with name, grade, parent phone, fee status
- Floating add button

### 8. Add/edit student

Fields:

- Student name
- Grade 1–11
- Medium
- School
- Parent name
- Parent phone
- Parental consent checkbox
- Optional notes

Actions:

- Save student
- Save and enroll

### 9. Student profile

Tabs:

- Overview
- Classes
- Attendance
- Fees
- Receipts

Important actions:

- Call parent
- WhatsApp parent
- Record payment
- Mark inactive

### 10. Classes list

Purpose: manage recurring class templates.

Content:

- Weekday filter
- Class cards with subject, grade, medium, time, monthly fee, capacity
- Status: active / paused

### 11. Create/edit class

Fields:

- Subject
- Grade
- Medium
- Hall/location
- Day
- Start time
- End time
- Monthly fee
- Capacity

### 12. Class detail

Content:

- Class summary
- Enrolled students
- Attendance history
- Fee collection summary for class
- Recent sessions

Actions:

- Take attendance
- Add student
- Record class payment
- Message class parents

### 13. Take attendance

Purpose: fast manual attendance.

Layout:

- Class header
- Date/session selector
- Student list
- Segmented control: present / late / absent
- Bulk mark present
- Save attendance

UX rule: big touch targets, usable while standing at the class door.

### 14. Fees dashboard

Content:

- Month selector
- Collected total
- Outstanding total
- Paid count
- Pending count
- Defaulter list
- Class filter

Actions:

- Record payment
- Send reminders later
- Export/report later

### 15. Record payment

Fields:

- Student
- Class
- Month
- Amount
- Payment method: cash by default
- Notes

Actions:

- Save payment
- Generate receipt

### 16. Receipt detail

Content:

- Receipt number
- Student name
- Class
- Month
- Amount
- Paid date
- Teacher/institute name

Actions:

- Share via WhatsApp later
- Download/print later

### 17. Reports hub

Cards:

- Daily attendance sheet
- Monthly outstanding
- Defaulter list
- Fee collection summary
- Student attendance percentage

### 18. Settings

Sections:

- Profile
- Institute/class name
- Language
- Subjects
- Fee settings
- Receipt settings
- Data/privacy
- Subscription later

## Phase 2 screens

- QR scanner attendance
- Offline sync queue
- WhatsApp reminder composer
- Absence alert composer
- Announcement broadcast
- Parent portal home
- Parent fee status
- Parent attendance view

## Phase 3 institute screens

- Institute dashboard
- Branch list
- Teacher list
- Staff list
- Hall management
- Timetable planner
- Payroll reports
- Online payment reconciliation

## Phase 4 AI assistance screens

- AI message assistant
- Student summary generator
- Progress note draft
- Message review and edit sheet

## Premium dashboard mobile layout

Recommended vertical order:

```txt
Safe area
Header greeting
Date + notification row
Hero summary card
Today metric grid
Next class card
Quick actions
Fee progress card
Today's schedule
Smart alerts
Bottom navigation
```

## Responsive behavior

### Small phones

- 2-column metric cards
- Single-column content cards
- Bottom nav only
- Avoid dense tables

### Large phones / foldables

- Wider cards
- Optional two-card rows
- More visible schedule items

### Tablets

- Navigation rail
- Dashboard content in 2 columns
- Reports can use wider charts

### Web dashboard later

- Sidebar navigation
- 12-column grid
- KPI row across top
- Schedule, fee chart, outstanding list, and quick actions in separate cards

## Empty states

Every screen must have a friendly empty state:

- No students: `Add your first student`
- No classes: `Create your first class`
- No attendance: `Take attendance for today's class`
- No payments: `Record your first cash payment`
- No reports: `Reports appear after attendance and payments`

## Loading states

Use skeleton cards for dashboard, students, classes, and fees. Avoid full-screen spinners except during first app launch.

## Error states

Each feature should show:

- What went wrong
- Retry action
- Offline hint if connection failed
