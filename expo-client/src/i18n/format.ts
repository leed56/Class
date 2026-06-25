import { Locale } from '@/i18n/types';

export const CANONICAL_WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type CanonicalWeekday = (typeof CANONICAL_WEEKDAYS)[number];

export const CLASS_SCHEDULE_WEEKDAYS = CANONICAL_WEEKDAYS.slice(0, 6);

const WEEKDAY_BASE_DATE = new Date(2024, 0, 1);

function localeTag(locale: Locale) {
  return locale === 'si' ? 'si-LK' : locale === 'ta' ? 'ta-LK' : 'en-LK';
}

export function getCanonicalWeekday(date = new Date()): CanonicalWeekday {
  return date.toLocaleDateString('en-US', { weekday: 'long' }) as CanonicalWeekday;
}

export function isCanonicalWeekday(value: string): value is CanonicalWeekday {
  return (CANONICAL_WEEKDAYS as readonly string[]).includes(value);
}

function weekdayToDate(weekday: CanonicalWeekday) {
  const index = CANONICAL_WEEKDAYS.indexOf(weekday);
  const date = new Date(WEEKDAY_BASE_DATE);
  date.setDate(WEEKDAY_BASE_DATE.getDate() + index);
  return date;
}

export function formatWeekdayName(
  locale: Locale,
  weekday: string,
  style: 'long' | 'short' | 'narrow' = 'long',
) {
  if (!isCanonicalWeekday(weekday)) return weekday;
  return weekdayToDate(weekday).toLocaleDateString(localeTag(locale), { weekday: style });
}

export function listWeekdayOptions(
  locale: Locale,
  weekdays: readonly string[] = CANONICAL_WEEKDAYS,
  style: 'long' | 'short' = 'long',
) {
  return weekdays.map((value) => ({
    value,
    label: formatWeekdayName(locale, value, style),
  }));
}

export function interpolate(template: string, vars: Record<string, string | number>) {
  let output = template;
  for (const [key, value] of Object.entries(vars)) {
    output = output.replaceAll(`{{${key}}}`, String(value));
  }
  return output;
}

export function getLocalizedTimeGreeting(locale: Locale, date = new Date()) {
  const hour = date.getHours();
  if (locale === 'si') {
    if (hour < 12) return 'සුභ උදෑසනක්';
    if (hour < 17) return 'සුභ දහවලක්';
    return 'සුභ සන්ධ්‍යාවක්';
  }
  if (locale === 'ta') {
    if (hour < 12) return 'காலை வணக்கம்';
    if (hour < 17) return 'மதிய வணக்கம்';
    return 'மாலை வணக்கம்';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatLocalizedTodayDate(locale: Locale, date = new Date()) {
  const tag = locale === 'si' ? 'si-LK' : locale === 'ta' ? 'ta-LK' : 'en-LK';
  return date.toLocaleDateString(tag, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
