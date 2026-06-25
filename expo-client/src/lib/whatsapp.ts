import { Alert, Linking, Platform } from 'react-native';

import { interpolate } from '@/i18n';

export { buildCombinedFeeReminderMessage, buildFeeReminderMessage } from '@/lib/whatsappMessages';

type TranslateFn = (path: string) => string;

function whatsappLine(
  t: TranslateFn | undefined,
  key: string,
  fallback: string,
  vars?: Record<string, string | number>,
) {
  const template = t?.(`whatsapp.${key}`) ?? fallback;
  return vars ? interpolate(template, vars) : template;
}

export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('94') && digits.length >= 11) {
    return digits.slice(0, 11);
  }

  if (digits.startsWith('0') && digits.length >= 10) {
    return `94${digits.slice(1, 10)}`;
  }

  if (digits.length === 9) {
    return `94${digits}`;
  }

  if (digits.length >= 10) {
    return digits;
  }

  return null;
}

export async function openWhatsAppChat(
  phone: string,
  message: string,
  t?: TranslateFn,
): Promise<boolean> {
  const invalidTitle = t?.('whatsapp.invalidPhoneTitle') ?? 'Invalid phone number';
  const invalidMessage =
    t?.('whatsapp.invalidPhoneMessage') ?? 'Add a valid parent phone number, for example +94 77 123 4567.';
  const failedTitle = t?.('whatsapp.openFailedTitle') ?? 'Could not open WhatsApp';
  const failedMessage =
    t?.('whatsapp.openFailedMessage') ?? 'Install WhatsApp or check the parent phone number.';

  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) {
    Alert.alert(invalidTitle, invalidMessage);
    return false;
  }

  const encoded = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${normalized}&text=${encoded}`;
  const webUrl = `https://wa.me/${normalized}?text=${encoded}`;

  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
      return true;
    }

    const canOpen = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpen ? appUrl : webUrl);
    return true;
  } catch {
    Alert.alert(failedTitle, failedMessage);
    return false;
  }
}

export function buildReceiptMessage(params: {
  workspaceName: string;
  studentName: string;
  className: string;
  amount: number;
  receiptNo: string;
  paidAt: string;
  method: string;
  allocations?: { label: string; amount: number }[];
  t?: TranslateFn;
}) {
  const { t } = params;
  const amount = `LKR ${params.amount.toLocaleString('en-LK')}`;
  const lines = [
    whatsappLine(t, 'receiptHeader', 'Payment received - {{workspaceName}}', {
      workspaceName: params.workspaceName,
    }),
    '',
    whatsappLine(t, 'receiptStudent', 'Student: {{studentName}}', { studentName: params.studentName }),
  ];

  if (params.allocations && params.allocations.length > 1) {
    lines.push(whatsappLine(t, 'receiptAppliedTo', 'Applied to:'));
    for (const line of params.allocations) {
      lines.push(
        whatsappLine(t, 'receiptAllocationLine', '- {{label}}: {{amount}}', {
          label: line.label,
          amount: `LKR ${line.amount.toLocaleString('en-LK')}`,
        }),
      );
    }
  } else {
    lines.push(
      whatsappLine(t, 'receiptClass', 'Class: {{className}}', { className: params.className }),
    );
  }

  lines.push(
    whatsappLine(t, 'receiptAmount', 'Amount: {{amount}}', { amount }),
    whatsappLine(t, 'receiptReceipt', 'Receipt: {{receiptNo}}', { receiptNo: params.receiptNo }),
    whatsappLine(t, 'receiptDate', 'Date: {{paidAt}}', { paidAt: params.paidAt }),
    whatsappLine(t, 'receiptMethod', 'Method: {{method}}', { method: params.method.toUpperCase() }),
    '',
    whatsappLine(t, 'receiptThankYou', 'Thank you for your payment.'),
  );

  return lines.join('\n');
}

export function buildCertificateMessage(params: {
  workspaceName: string;
  studentName: string;
  certificateType: string;
  title: string;
  serialNo: string;
  issuedOn: string;
  note?: string | null;
  t?: TranslateFn;
}) {
  const { t } = params;
  const lines = [
    whatsappLine(t, 'certificateHeader', 'Certificate issued - {{workspaceName}}', {
      workspaceName: params.workspaceName,
    }),
    '',
    whatsappLine(t, 'certificateStudent', 'Student: {{studentName}}', { studentName: params.studentName }),
    whatsappLine(t, 'certificateType', 'Type: {{certificateType}}', {
      certificateType: params.certificateType,
    }),
    whatsappLine(t, 'certificateTitle', 'Title: {{title}}', { title: params.title }),
    whatsappLine(t, 'certificateSerial', 'Serial: {{serialNo}}', { serialNo: params.serialNo }),
    whatsappLine(t, 'certificateIssuedOn', 'Issued on: {{issuedOn}}', { issuedOn: params.issuedOn }),
  ];

  if (params.note) {
    lines.push(whatsappLine(t, 'certificateNote', 'Note: {{note}}', { note: params.note }));
  }

  lines.push('', whatsappLine(t, 'certificateClosing', 'Congratulations and best wishes.'));
  return lines.join('\n');
}

export function buildParentMessage(params: {
  workspaceName: string;
  studentName: string;
  parentName: string;
  t?: TranslateFn;
}) {
  const { t } = params;
  return [
    whatsappLine(t, 'parentGreeting', 'Hello {{parentName}},', { parentName: params.parentName }),
    '',
    whatsappLine(t, 'parentIntro', 'This is {{workspaceName}} regarding {{studentName}}.', {
      workspaceName: params.workspaceName,
      studentName: params.studentName,
    }),
    '',
    whatsappLine(t, 'parentClosing', 'Please let us know if you have any questions.'),
  ].join('\n');
}

export function buildAbsenceAlertMessage(params: {
  workspaceName: string;
  studentName: string;
  className: string;
  sessionDate: string;
  template?: string;
  t?: TranslateFn;
}) {
  const defaultTemplate =
    params.t?.('whatsapp.absenceDefaultTemplate') ??
    `Dear parent,

{{student_name}} was marked absent from {{class_name}} on {{session_date}} at {{workspace_name}}.

Please contact the teacher if there is a concern. Thank you.`;

  const template = params.template?.trim() || defaultTemplate;

  return template
    .replaceAll('{{student_name}}', params.studentName)
    .replaceAll('{{class_name}}', params.className)
    .replaceAll('{{session_date}}', params.sessionDate)
    .replaceAll('{{workspace_name}}', params.workspaceName);
}
