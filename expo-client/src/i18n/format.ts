import { Locale } from '@/i18n/types';

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
