import { Alert } from 'react-native';

import { sendLoggedDefaulterReminder, type DefaulterReminderTarget } from '@/features/fees/feeReminderService';
import { FeeInvoice } from '@/features/fees/models';
import { LanguageCode } from '@/lib/database.types';
import { normalizeWhatsAppPhone } from '@/lib/whatsapp';

export type { DefaulterReminderTarget };
export function groupDefaulterReminders(invoices: FeeInvoice[]): DefaulterReminderTarget[] {
  const byPhone = new Map<string, FeeInvoice[]>();

  for (const invoice of invoices) {
    const key = normalizeWhatsAppPhone(invoice.parentPhone) ?? invoice.parentPhone.trim();
    const list = byPhone.get(key) ?? [];
    list.push(invoice);
    byPhone.set(key, list);
  }

  return Array.from(byPhone.entries())
    .map(([parentPhone, items]) => {
      const sorted = [...items].sort((a, b) => b.outstandingAmount - a.outstandingAmount);
      return {
        parentPhone,
        parentLabel: sorted[0].studentName,
        invoices: sorted,
        totalOutstanding: sorted.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0),
      };
    })
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}

function confirmAction(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', onPress: () => resolve(true) },
    ]);
  });
}

export type BulkReminderResult = {
  opened: number;
  skipped: number;
  stoppedEarly: boolean;
};

export async function runBulkDefaulterReminders(
  invoices: FeeInvoice[],
  workspaceName: string,
  locale: LanguageCode = 'en',
): Promise<BulkReminderResult> {
  const targets = groupDefaulterReminders(invoices);
  if (targets.length === 0) {
    return { opened: 0, skipped: 0, stoppedEarly: false };
  }

  const invoiceCount = invoices.length;
  const parentLabel = targets.length === 1 ? '1 parent' : `${targets.length} parents`;
  const shouldStart = await confirmAction(
    'Remind all defaulters?',
    `Open WhatsApp for ${parentLabel} one at a time (${invoiceCount} open invoice${invoiceCount === 1 ? '' : 's'}). Send each message before continuing.`,
  );
  if (!shouldStart) {
    return { opened: 0, skipped: 0, stoppedEarly: false };
  }

  let opened = 0;
  let skipped = 0;
  let stoppedEarly = false;

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];

    if (index > 0) {
      const extraCount = target.invoices.length - 1;
      const label =
        extraCount > 0
          ? `${target.parentLabel} (+${extraCount} more invoice${extraCount === 1 ? '' : 's'})`
          : target.parentLabel;
      const shouldContinue = await confirmAction(
        `Reminder ${index + 1} of ${targets.length}`,
        `Open WhatsApp for ${label}?`,
      );
      if (!shouldContinue) {
        stoppedEarly = true;
        break;
      }
    }

    const result = await sendLoggedDefaulterReminder({
      workspaceName,
      target,
      locale,
    });
    if (result.opened) {
      opened += 1;
    } else {
      skipped += 1;
    }
  }

  return { opened, skipped, stoppedEarly };
}

export function showBulkReminderSummary(result: BulkReminderResult) {
  if (result.opened === 0 && result.skipped === 0) return;

  const parts: string[] = [];
  if (result.opened > 0) {
    parts.push(`Opened ${result.opened} WhatsApp chat${result.opened === 1 ? '' : 's'}.`);
  }
  if (result.skipped > 0) {
    parts.push(`Skipped ${result.skipped} invalid phone number${result.skipped === 1 ? '' : 's'}.`);
  }
  if (result.stoppedEarly) {
    parts.push('Stopped before all parents were reached.');
  }

  Alert.alert('Reminders', parts.join(' '));
}
