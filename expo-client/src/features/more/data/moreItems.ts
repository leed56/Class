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

type Translate = (path: string) => string;

export function buildReportCommands(t: Translate): MoreCommand[] {
  return [
    {
      id: 'attendance-sheet',
      title: t('moreItems.dailyAttendanceTitle'),
      subtitle: t('moreItems.dailyAttendanceSubtitle'),
      icon: 'clipboard-check-outline',
      color: colors.primary,
      href: '/reports',
    },
    {
      id: 'monthly-outstanding',
      title: t('moreItems.outstandingFeesTitle'),
      subtitle: t('moreItems.outstandingFeesSubtitle'),
      icon: 'cash-clock',
      color: colors.danger,
      badge: t('moreItems.outstandingFeesBadge'),
      href: '/reports',
    },
    {
      id: 'defaulters',
      title: t('moreItems.defaulterListTitle'),
      subtitle: t('moreItems.defaulterListSubtitle'),
      icon: 'account-alert-outline',
      color: colors.warning,
      badge: t('moreItems.defaulterListBadge'),
      href: '/reports',
    },
    {
      id: 'receipts',
      title: t('moreItems.receiptsTitle'),
      subtitle: t('moreItems.receiptsSubtitle'),
      icon: 'receipt-text-check-outline',
      color: colors.success,
      href: '/reports',
    },
  ];
}

export function buildSetupCommands(t: Translate): MoreSetting[] {
  return [
    {
      id: 'settings-home',
      title: t('moreItems.settingsDashboardTitle'),
      subtitle: t('moreItems.settingsDashboardSubtitle'),
      icon: 'cog-outline',
      color: colors.primary,
      href: '/settings',
    },
    {
      id: 'subjects',
      title: t('moreItems.subjectsTitle'),
      subtitle: t('moreItems.subjectsSubtitle'),
      icon: 'book-education-outline',
      color: colors.info,
      href: '/settings/subjects',
    },
    {
      id: 'launch-checklist',
      title: t('moreItems.launchChecklistTitle'),
      subtitle: t('moreItems.launchChecklistSubtitle'),
      icon: 'rocket-launch-outline',
      color: colors.warning,
      value: t('moreItems.valueReadyPath'),
      href: '/settings/launch-checklist',
    },
    {
      id: 'language',
      title: t('moreItems.languageTitle'),
      subtitle: t('moreItems.languageSubtitle'),
      icon: 'translate',
      color: colors.primary,
      value: t('moreItems.valueEnglish'),
      href: '/settings',
    },
    {
      id: 'receipts-settings',
      title: t('moreItems.receiptSettingsTitle'),
      subtitle: t('moreItems.receiptSettingsSubtitle'),
      icon: 'receipt-text-edit-outline',
      color: colors.success,
      href: '/settings',
    },
    {
      id: 'privacy-consent',
      title: t('moreItems.privacyConsentTitle'),
      subtitle: t('moreItems.privacyConsentSubtitle'),
      icon: 'shield-check-outline',
      color: colors.warning,
      value: t('moreItems.valuePdpaAware'),
      href: '/settings/launch-checklist',
    },
  ];
}

export function buildIntegrationCommands(t: Translate): MoreSetting[] {
  return [
    {
      id: 'reachwa',
      title: t('moreItems.reachwaTitle'),
      subtitle: t('moreItems.reachwaSubtitle'),
      icon: 'whatsapp',
      color: colors.success,
      value: t('moreItems.valuePhase2'),
      href: '/settings/communication',
    },
    {
      id: 'sms',
      title: t('moreItems.smsFallbackTitle'),
      subtitle: t('moreItems.smsFallbackSubtitle'),
      icon: 'message-processing-outline',
      color: colors.info,
      value: t('moreItems.valueLater'),
      href: '/settings/communication',
    },
    {
      id: 'subscription',
      title: t('moreItems.subscriptionTitle'),
      subtitle: t('moreItems.subscriptionSubtitle'),
      icon: 'crown-outline',
      color: colors.primary,
      value: t('moreItems.valueFree'),
      href: '/settings/subscription',
    },
  ];
}
