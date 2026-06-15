# Planned Project Structure

ClassFlow starts as a Flutter teacher mobile app with a Supabase backend. The structure keeps the app modular so later institute, parent, and BrainCoin features can be added without rewriting the MVP.

## Root structure

```txt
Class/
  README.md
  docs/
    PHASE_PLAN.md
    PROJECT_STRUCTURE.md
    UI_SCREENS.md
    DESIGN_SYSTEM.md
    SUPABASE_SCHEMA.md
  mobile/
    pubspec.yaml
    lib/
    assets/
    test/
  supabase/
    migrations/
    seed.sql
    functions/
  .github/
    workflows/
```

## Flutter mobile structure

```txt
mobile/lib/
  main.dart
  app/
    classflow_app.dart
    router.dart
    bootstrap.dart
  core/
    config/
      env.dart
      app_config.dart
    constants/
      app_sizes.dart
      app_strings.dart
    errors/
      app_exception.dart
      failure.dart
    localization/
      app_localizations.dart
      supported_languages.dart
    network/
      connectivity_service.dart
    utils/
      currency_formatter.dart
      date_formatter.dart
  shared/
    theme/
      app_theme.dart
      app_colors.dart
      app_typography.dart
      app_radius.dart
      app_shadows.dart
    widgets/
      app_button.dart
      app_text_field.dart
      metric_card.dart
      empty_state.dart
      loading_state.dart
      error_state.dart
      premium_card.dart
      section_header.dart
    layout/
      responsive_scaffold.dart
      mobile_shell.dart
      bottom_nav_shell.dart
  features/
    auth/
      data/
      domain/
      presentation/
    onboarding/
      data/
      domain/
      presentation/
    dashboard/
      data/
      domain/
      presentation/
    students/
      data/
      domain/
      presentation/
    subjects/
      data/
      domain/
      presentation/
    classes/
      data/
      domain/
      presentation/
    attendance/
      data/
      domain/
      presentation/
    fees/
      data/
      domain/
      presentation/
    reports/
      data/
      domain/
      presentation/
    settings/
      data/
      domain/
      presentation/
```

## Feature module pattern

Each feature follows this pattern:

```txt
feature_name/
  data/
    models/
    repositories/
    datasources/
  domain/
    entities/
    repositories/
    usecases/
  presentation/
    screens/
    widgets/
    controllers/
```

## MVP navigation tabs

```txt
Home
Classes
Students
Fees
More
```

Attendance lives inside class/session flows, but can later become its own tab for institutes.

## Supabase structure

```txt
supabase/
  migrations/
    001_initial_schema.sql
    002_rls_policies.sql
    003_seed_subjects.sql
  seed.sql
  functions/
    generate-monthly-invoices/
    send-fee-reminders/
```

## Key backend tables planned

```txt
tenants
profiles
students
subjects
class_templates
enrollments
sessions
attendance_records
monthly_fee_invoices
payments
receipts
announcements
message_logs
```

## Naming rules

- Use `ClassFlow` in user-facing copy.
- Use `tenant` for teacher/institute account ownership.
- Use `class_template` for recurring tuition classes.
- Use `session` for a specific class occurrence.
- Keep SaaS subscription billing separate from tuition fee tracking.

## Development order

1. Create Flutter scaffold
2. Add design tokens and shared widgets
3. Add router and bottom navigation shell
4. Build static premium dashboard
5. Connect dashboard to mock data
6. Add Supabase auth
7. Add real Supabase tables and repositories
8. Replace mock data feature by feature
