# ClassFlow Design System

The ClassFlow UI should feel premium, calm, trustworthy, and fast. The design language is built for Sri Lankan tuition teachers who need quick daily workflows, not complex enterprise dashboards.

## Brand feel

Keywords:

- Premium
- Clean
- Trustworthy
- Fast
- Warm
- Mobile-native
- Trilingual
- Cash-first
- WhatsApp-native

## Visual direction

Use a white and deep-indigo base with soft purple accents, subtle gradients, rounded cards, and clear data cards.

### Suggested color tokens

```txt
Primary: Deep Indigo / Purple
Accent: Emerald for collected/paid/success
Warning: Amber for attention
Danger: Soft Red for overdue/absent
Background: Warm off-white
Surface: White
Text primary: Deep navy
Text secondary: Slate gray
Border: Soft cool gray
```

### Suggested semantic colors

```txt
Paid / collected: green
Outstanding / overdue: red
Late / warning: amber
Attendance present: green
Attendance late: amber
Attendance absent: red
Info / neutral: blue or purple
```

## Typography

Rules:

- Use large clear numbers for fees and metrics.
- Keep labels short.
- Support Sinhala and Tamil text expansion.
- Avoid all-caps labels except tiny badges.

Recommended text hierarchy:

```txt
Display number: dashboard metrics and rupee totals
Title large: screen title
Title medium: card title
Body: normal content
Caption: metadata and helper text
Badge: status text
```

## Spacing

Recommended base spacing:

```txt
4, 8, 12, 16, 20, 24, 32
```

Mobile screen padding:

```txt
16px standard
20px for premium dashboard sections
```

## Radius

Use soft rounded corners:

```txt
Small: 8
Medium: 12
Large: 16
Extra large: 24
Hero cards: 28
```

## Shadows

Use subtle shadows only. The app should feel premium, not heavy.

Rules:

- Cards use light shadow and border.
- Primary action buttons can have soft elevation.
- Avoid dark drop shadows on white cards.

## Components

### PremiumCard

Used for dashboard, reports, and summary blocks.

Properties:

- title
- subtitle optional
- child
- action optional
- gradient optional
- status optional

### MetricCard

Used for numbers like students, attendance, collected, outstanding.

Properties:

- label
- value
- delta optional
- icon
- tone

### QuickActionTile

Used on dashboard.

Properties:

- icon
- label
- tone
- route/action

### ClassCard

Used for class list and dashboard next class.

Properties:

- subject
- grade
- medium
- time
- hall
- enrolled count
- monthly fee
- next action

### StudentCard

Used for student lists.

Properties:

- name
- grade
- medium
- parent phone
- fee status
- attendance status optional

### FeeStatusBadge

Statuses:

```txt
Paid
Partial
Pending
Overdue
Waived
```

### AttendanceStatusControl

Large segmented control:

```txt
Present | Late | Absent
```

## Dashboard interaction rules

- `Take Attendance` must be the strongest call to action when a class is upcoming or in progress.
- `Record Payment` must always be one tap from dashboard and fee screens.
- WhatsApp actions appear contextually beside fee reminders, absences, and announcements.
- Avoid hiding urgent fee/attendance alerts inside reports.

## Accessibility rules

- Minimum 44px touch targets.
- High contrast text on cards.
- Do not rely on color alone for status.
- Sinhala/Tamil strings must not be clipped.
- Support dynamic font scaling where possible.

## Responsive UI rules

### Phones

- Bottom navigation
- Single-column card stack
- 2-column metric grid

### Tablets

- Navigation rail
- 2-column dashboard grid
- Larger reports/charts

### Web later

- Sidebar navigation
- Dense tables allowed
- Advanced filters visible by default

## Animation style

Keep motion light:

- Page transitions: smooth slide/fade
- Card loading: skeleton shimmer
- Payment success: small receipt success animation
- Attendance save: quick confirmation toast/snackbar

## Copy tone

Use simple teacher-friendly language.

Examples:

```txt
Add your first student
Take attendance
Record cash payment
Send fee reminder
View defaulters
Monthly collection
```

Avoid technical terms in the UI:

```txt
Do not show: tenant, invoice generation job, RLS, session object
Show instead: account, monthly fees, class date
```
