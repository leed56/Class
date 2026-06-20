import {
  createMessageDelivery,
  updateMessageDeliveryStatus,
} from '@/features/communications/communicationService';
import { FeeInvoice } from '@/features/fees/models';
import { LanguageCode } from '@/lib/database.types';
import {
  buildCombinedFeeReminderMessage,
  buildFeeReminderMessage,
} from '@/lib/whatsappMessages';
import { openWhatsAppChat } from '@/lib/whatsapp';

export type DefaulterReminderTarget = {
  parentPhone: string;
  parentLabel: string;
  invoices: FeeInvoice[];
  totalOutstanding: number;
};

export function buildDefaulterReminderMessage(
  workspaceName: string,
  target: DefaulterReminderTarget,
  locale: LanguageCode = 'en',
) {
  if (target.invoices.length === 1) {
    const invoice = target.invoices[0];
    return buildFeeReminderMessage({
      workspaceName,
      studentName: invoice.studentName,
      className: invoice.className,
      month: invoice.month,
      outstandingAmount: invoice.outstandingAmount,
      locale,
    });
  }

  return buildCombinedFeeReminderMessage({
    workspaceName,
    month: target.invoices[0].month,
    locale,
    items: target.invoices.map((invoice) => ({
      studentName: invoice.studentName,
      className: invoice.className,
      outstandingAmount: invoice.outstandingAmount,
    })),
  });
}

export async function sendLoggedFeeReminder(input: {
  workspaceName: string;
  invoice: FeeInvoice;
  locale?: LanguageCode;
}) {
  const message = buildFeeReminderMessage({
    workspaceName: input.workspaceName,
    studentName: input.invoice.studentName,
    className: input.invoice.className,
    month: input.invoice.month,
    outstandingAmount: input.invoice.outstandingAmount,
    locale: input.locale ?? 'en',
  });

  const delivery = await createMessageDelivery({
    studentId: input.invoice.studentId,
    parentPhone: input.invoice.parentPhone,
    messageType: 'fee_reminder',
    channel: 'whatsapp',
    body: message,
    status: 'draft',
  });

  const opened = await openWhatsAppChat(input.invoice.parentPhone, message);
  await updateMessageDeliveryStatus(
    delivery.id,
    opened ? 'sent' : 'failed',
    opened ? null : 'Could not open WhatsApp.',
  );

  return { opened, deliveryId: delivery.id };
}

export async function sendLoggedDefaulterReminder(input: {
  workspaceName: string;
  target: DefaulterReminderTarget;
  locale?: LanguageCode;
}) {
  const message = buildDefaulterReminderMessage(input.workspaceName, input.target, input.locale ?? 'en');
  const primaryStudentId = input.target.invoices[0]?.studentId ?? null;

  const delivery = await createMessageDelivery({
    studentId: primaryStudentId,
    parentPhone: input.target.parentPhone,
    messageType: 'fee_reminder',
    channel: 'whatsapp',
    body: message,
    status: 'draft',
  });

  const opened = await openWhatsAppChat(input.target.parentPhone, message);
  await updateMessageDeliveryStatus(
    delivery.id,
    opened ? 'sent' : 'failed',
    opened ? null : 'Could not open WhatsApp.',
  );

  return { opened, deliveryId: delivery.id };
}
