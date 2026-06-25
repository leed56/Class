import { interpolate } from '@/i18n/format';
import { en } from '@/i18n/locales/en';
import { si } from '@/i18n/locales/si';
import { ta } from '@/i18n/locales/ta';
import { LanguageCode } from '@/lib/database.types';

const localeTrees = { en, si, ta } as const;

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

type WhatsAppCopyKey =
  | 'feeReminderHeader'
  | 'feeReminderDearParent'
  | 'feeReminderClosing'
  | 'feeReminderBody'
  | 'feeReminderCombinedIntro'
  | 'feeReminderCombinedLine'
  | 'feeReminderCombinedTotal';

function whatsappCopy(locale: LanguageCode, key: WhatsAppCopyKey, vars?: Record<string, string | number>) {
  const template = localeTrees[locale].whatsapp[key];
  return vars ? interpolate(template, vars) : template;
}

export function buildFeeReminderMessage(params: {
  workspaceName: string;
  studentName: string;
  className: string;
  month: string;
  outstandingAmount: number;
  locale?: LanguageCode;
}) {
  const locale = params.locale ?? 'en';
  const amount = formatLkr(params.outstandingAmount);

  return [
    whatsappCopy(locale, 'feeReminderHeader', { workspaceName: params.workspaceName }),
    '',
    whatsappCopy(locale, 'feeReminderDearParent'),
    whatsappCopy(locale, 'feeReminderBody', {
      studentName: params.studentName,
      className: params.className,
      month: params.month,
      amount,
    }),
    '',
    whatsappCopy(locale, 'feeReminderClosing'),
  ].join('\n');
}

export function buildCombinedFeeReminderMessage(params: {
  workspaceName: string;
  month: string;
  items: { studentName: string; className: string; outstandingAmount: number }[];
  locale?: LanguageCode;
}) {
  const locale = params.locale ?? 'en';
  const total = params.items.reduce((sum, item) => sum + item.outstandingAmount, 0);
  const lines = params.items.map((item) =>
    whatsappCopy(locale, 'feeReminderCombinedLine', {
      studentName: item.studentName,
      className: item.className,
      amount: formatLkr(item.outstandingAmount),
    }),
  );

  return [
    whatsappCopy(locale, 'feeReminderHeader', { workspaceName: params.workspaceName }),
    '',
    whatsappCopy(locale, 'feeReminderDearParent'),
    whatsappCopy(locale, 'feeReminderCombinedIntro', { month: params.month }),
    ...lines,
    '',
    whatsappCopy(locale, 'feeReminderCombinedTotal', { amount: formatLkr(total) }),
    '',
    whatsappCopy(locale, 'feeReminderClosing'),
  ].join('\n');
}
