import { Alert } from 'react-native';

import { sendLoggedDefaulterReminder, type DefaulterReminderTarget } from '@/features/fees/feeReminderService';
import { FeeInvoice } from '@/features/fees/models';
import { interpolate } from '@/i18n';
import { LanguageCode } from '@/lib/database.types';
import { normalizeWhatsAppPhone } from '@/lib/whatsapp';

type Translate = (path: string) => string;

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

function confirmAction(t: Translate, title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: t('whatsapp.continue'), onPress: () => resolve(true) },
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
  t: Translate,
  locale: LanguageCode = 'en',
): Promise<BulkReminderResult> {
  const targets = groupDefaulterReminders(invoices);
  if (targets.length === 0) {
    return { opened: 0, skipped: 0, stoppedEarly: false };
  }

  const invoiceCount = invoices.length;
  const parentLabel =
    targets.length === 1
      ? t('fees.bulkRemindOneParent')
      : interpolate(t('fees.bulkRemindManyParents'), { count: targets.length });
  const shouldStart = await confirmAction(
    t,
    t('fees.bulkRemindConfirmTitle'),
    interpolate(t('fees.bulkRemindConfirmMessage'), { parents: parentLabel, invoices: invoiceCount }),
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
          ? interpolate(t('fees.bulkRemindExtraInvoices'), { name: target.parentLabel, count: extraCount })
          : target.parentLabel;
      const shouldContinue = await confirmAction(
        t,
        interpolate(t('fees.bulkRemindStepTitle'), { current: index + 1, total: targets.length }),
        interpolate(t('fees.bulkRemindStepMessage'), { label }),
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
      t,
    });
    if (result.opened) {
      opened += 1;
    } else {
      skipped += 1;
    }
  }

  return { opened, skipped, stoppedEarly };
}

export function showBulkReminderSummary(result: BulkReminderResult, t: Translate) {
  if (result.opened === 0 && result.skipped === 0) return;

  const parts: string[] = [];
  if (result.opened > 0) {
    parts.push(interpolate(t('fees.bulkRemindOpened'), { count: result.opened }));
  }
  if (result.skipped > 0) {
    parts.push(interpolate(t('fees.bulkRemindSkipped'), { count: result.skipped }));
  }
  if (result.stoppedEarly) {
    parts.push(t('fees.bulkRemindStoppedEarly'));
  }

  Alert.alert(t('fees.bulkRemindSummaryTitle'), parts.join(' '));
}
