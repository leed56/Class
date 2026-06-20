import { LanguageCode } from '@/lib/database.types';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function feeReminderHeader(workspaceName: string, locale: LanguageCode) {
  if (locale === 'si') return `ගාස්තු සිහිකිරීම - ${workspaceName}`;
  if (locale === 'ta') return `கட்டண நினைவூட்டல் - ${workspaceName}`;
  return `Fee reminder - ${workspaceName}`;
}

function feeReminderClosing(locale: LanguageCode) {
  if (locale === 'si') {
    return 'කරුණාකර හැකි ඉක්මනින් ගෙවන්න. ස්තුතියි.';
  }
  if (locale === 'ta') {
    return 'தயவுசெய்து விரைவில் செலுத்துங்கள். நன்றி.';
  }
  return 'Please settle at your earliest convenience. Thank you.';
}

function dearParent(locale: LanguageCode) {
  if (locale === 'si') return 'ප්‍රිය දෙමාපියනි,';
  if (locale === 'ta') return 'அன்புள்ள பெற்றோரே,';
  return 'Dear parent,';
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

  if (locale === 'si') {
    return [
      feeReminderHeader(params.workspaceName, locale),
      '',
      dearParent(locale),
      `${params.studentName} ශිෂ්‍යයාගේ ${params.className} (${params.month}) පන්ති ගාස්තුව ${amount} ඉතිරිව ඇත.`,
      '',
      feeReminderClosing(locale),
    ].join('\n');
  }

  if (locale === 'ta') {
    return [
      feeReminderHeader(params.workspaceName, locale),
      '',
      dearParent(locale),
      `${params.studentName} அவர்களின் ${params.className} (${params.month}) வகுப்புக் கட்டணம் ${amount} நிலுவையில் உள்ளது.`,
      '',
      feeReminderClosing(locale),
    ].join('\n');
  }

  return [
    feeReminderHeader(params.workspaceName, locale),
    '',
    dearParent(locale),
    `This is a friendly reminder that ${params.studentName}'s tuition fee for ${params.className} (${params.month}) has an outstanding balance of ${amount}.`,
    '',
    feeReminderClosing(locale),
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
  const lines = params.items.map(
    (item) =>
      `- ${item.studentName} (${item.className}): ${formatLkr(item.outstandingAmount)}`,
  );

  if (locale === 'si') {
    return [
      feeReminderHeader(params.workspaceName, locale),
      '',
      dearParent(locale),
      `${params.month} සඳහා ඉතිරි ගාස්තු:`,
      ...lines,
      '',
      `මුළු ඉතිරි: ${formatLkr(total)}`,
      '',
      feeReminderClosing(locale),
    ].join('\n');
  }

  if (locale === 'ta') {
    return [
      feeReminderHeader(params.workspaceName, locale),
      '',
      dearParent(locale),
      `${params.month} க்கான நிலுவை கட்டணங்கள்:`,
      ...lines,
      '',
      `மொத்த நிலுவை: ${formatLkr(total)}`,
      '',
      feeReminderClosing(locale),
    ].join('\n');
  }

  return [
    feeReminderHeader(params.workspaceName, locale),
    '',
    dearParent(locale),
    `Outstanding tuition fees for ${params.month}:`,
    ...lines,
    '',
    `Total outstanding: ${formatLkr(total)}`,
    '',
    feeReminderClosing(locale),
  ].join('\n');
}
