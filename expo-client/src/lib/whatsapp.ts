import { Alert, Linking, Platform } from 'react-native';

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

export async function openWhatsAppChat(phone: string, message: string): Promise<boolean> {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) {
    Alert.alert('Invalid phone number', 'Add a valid parent phone number, for example +94 77 123 4567.');
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
    Alert.alert('Could not open WhatsApp', 'Install WhatsApp or check the parent phone number.');
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
}) {
  const amount = `LKR ${params.amount.toLocaleString('en-LK')}`;
  const lines = [
    `Payment received - ${params.workspaceName}`,
    '',
    `Student: ${params.studentName}`,
  ];

  if (params.allocations && params.allocations.length > 1) {
    lines.push('Applied to:');
    for (const line of params.allocations) {
      lines.push(`- ${line.label}: LKR ${line.amount.toLocaleString('en-LK')}`);
    }
  } else {
    lines.push(`Class: ${params.className}`);
  }

  lines.push(
    `Amount: ${amount}`,
    `Receipt: ${params.receiptNo}`,
    `Date: ${params.paidAt}`,
    `Method: ${params.method.toUpperCase()}`,
    '',
    'Thank you for your payment.',
  );

  return lines.join('\n');
}

export function buildFeeReminderMessage(params: {
  workspaceName: string;
  studentName: string;
  className: string;
  month: string;
  outstandingAmount: number;
}) {
  const amount = `LKR ${params.outstandingAmount.toLocaleString('en-LK')}`;

  return [
    `Fee reminder - ${params.workspaceName}`,
    '',
    'Dear parent,',
    `This is a friendly reminder that ${params.studentName}'s tuition fee for ${params.className} (${params.month}) has an outstanding balance of ${amount}.`,
    '',
    'Please settle at your earliest convenience. Thank you.',
  ].join('\n');
}

export function buildCombinedFeeReminderMessage(params: {
  workspaceName: string;
  month: string;
  items: { studentName: string; className: string; outstandingAmount: number }[];
}) {
  const total = params.items.reduce((sum, item) => sum + item.outstandingAmount, 0);
  const lines = params.items.map(
    (item) =>
      `- ${item.studentName} (${item.className}): LKR ${item.outstandingAmount.toLocaleString('en-LK')}`,
  );

  return [
    `Fee reminder - ${params.workspaceName}`,
    '',
    'Dear parent,',
    `Outstanding tuition fees for ${params.month}:`,
    ...lines,
    '',
    `Total outstanding: LKR ${total.toLocaleString('en-LK')}`,
    '',
    'Please settle at your earliest convenience. Thank you.',
  ].join('\n');
}

export function buildParentMessage(params: {
  workspaceName: string;
  studentName: string;
  parentName: string;
}) {
  return [
    `Hello ${params.parentName},`,
    '',
    `This is ${params.workspaceName} regarding ${params.studentName}.`,
    '',
    'Please let us know if you have any questions.',
  ].join('\n');
}
