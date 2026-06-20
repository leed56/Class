import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';

export type MoreCommand = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  badge?: string;
  href: string;
};

export type MoreSetting = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  value?: string;
  href: string;
};

export const reportCommands: MoreCommand[] = [
  {
    id: 'attendance-sheet',
    title: 'Daily Attendance',
    subtitle: 'Class-wise present, late and absent report',
    icon: 'clipboard-check-outline',
    color: colors.primary,
    href: '/reports',
  },
  {
    id: 'monthly-outstanding',
    title: 'Outstanding Fees',
    subtitle: 'June pending and overdue student list',
    icon: 'cash-clock',
    color: colors.danger,
    badge: '12 pending',
    href: '/reports',
  },
  {
    id: 'defaulters',
    title: 'Defaulter List',
    subtitle: 'Parents to follow up through WhatsApp',
    icon: 'account-alert-outline',
    color: colors.warning,
    badge: 'High value',
    href: '/reports',
  },
  {
    id: 'receipts',
    title: 'Receipts',
    subtitle: 'View, share or print digital receipts',
    icon: 'receipt-text-check-outline',
    color: colors.success,
    href: '/reports',
  },
];

export const setupCommands: MoreSetting[] = [
  {
    id: 'settings-home',
    title: 'Settings Dashboard',
    subtitle: 'Workspace, teacher profile, plan and launch setup',
    icon: 'cog-outline',
    color: colors.primary,
    href: '/settings',
  },
  {
    id: 'subjects',
    title: 'Subjects',
    subtitle: 'Main, language, literature and optional subjects',
    icon: 'book-education-outline',
    color: colors.info,
    href: '/settings/subjects',
  },
  {
    id: 'launch-checklist',
    title: 'Launch Checklist',
    subtitle: 'Production readiness, QA, env vars and store prep',
    icon: 'rocket-launch-outline',
    color: colors.warning,
    value: 'Ready path',
    href: '/settings/launch-checklist',
  },
  {
    id: 'language',
    title: 'Language',
    subtitle: 'English, Sinhala and Tamil UI foundation',
    icon: 'translate',
    color: colors.primary,
    value: 'English',
    href: '/settings',
  },
  {
    id: 'receipts-settings',
    title: 'Receipt Settings',
    subtitle: 'Teacher name, footer, numbering and branding',
    icon: 'receipt-text-edit-outline',
    color: colors.success,
    href: '/settings',
  },
  {
    id: 'privacy-consent',
    title: 'Privacy & Consent',
    subtitle: 'Parent consent and data-retention controls',
    icon: 'shield-check-outline',
    color: colors.warning,
    value: 'PDPA-aware',
    href: '/settings/launch-checklist',
  },
];

export const integrationCommands: MoreSetting[] = [
  {
    id: 'reachwa',
    title: 'ReachWA / WhatsApp',
    subtitle: 'Fee reminders, absence alerts and class broadcasts',
    icon: 'whatsapp',
    color: colors.success,
    value: 'Phase 2',
    href: '/settings/communication',
  },
  {
    id: 'sms',
    title: 'SMS Fallback',
    subtitle: 'Text.lk SMS fallback for parents offline',
    icon: 'message-processing-outline',
    color: colors.info,
    value: 'Later',
    href: '/settings/communication',
  },
  {
    id: 'subscription',
    title: 'Subscription Plan',
    subtitle: 'Free, Starter and Institute SaaS billing',
    icon: 'crown-outline',
    color: colors.primary,
    value: 'Free',
    href: '/settings/subscription',
  },
];