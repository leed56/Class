import { Platform, Share } from 'react-native';

import { FeeInvoice } from '@/features/fees/models';

function escapeCsvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(cells: (string | number)[]) {
  return cells.map(escapeCsvCell).join(',');
}

export function buildDefaulterCsv(monthLabel: string, workspaceName: string, invoices: FeeInvoice[]) {
  const rows = [...invoices].sort((a, b) => b.outstandingAmount - a.outstandingAmount);
  const totalOutstanding = rows.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);

  const lines = [
    csvRow(['ClassFlow Defaulter List']),
    csvRow(['Workspace', workspaceName]),
    csvRow(['Month', monthLabel]),
    csvRow(['Generated', new Date().toLocaleString('en-LK')]),
    csvRow(['Defaulters', rows.length]),
    csvRow(['Total outstanding', totalOutstanding]),
    '',
    csvRow([
      'Student',
      'Grade',
      'Medium',
      'Class',
      'Month',
      'Monthly Fee',
      'Paid',
      'Outstanding',
      'Status',
      'Days Overdue',
      'Parent Phone',
    ]),
    ...rows.map((invoice) =>
      csvRow([
        invoice.studentName,
        invoice.grade,
        invoice.medium,
        invoice.className,
        invoice.month,
        invoice.monthlyFee,
        invoice.paidAmount,
        invoice.outstandingAmount,
        invoice.status,
        invoice.dueDays,
        invoice.parentPhone,
      ]),
    ),
  ];

  return lines.join('\n');
}

export function getDefaulterExportFilename(monthLabel: string) {
  const slug = monthLabel.toLowerCase().replace(/\s+/g, '-');
  return `classflow-defaulters-${slug}.csv`;
}

export async function exportDefaulterCsv(monthLabel: string, workspaceName: string, invoices: FeeInvoice[]) {
  if (invoices.length === 0) {
    throw new Error('No outstanding invoices to export.');
  }

  const csv = buildDefaulterCsv(monthLabel, workspaceName, invoices);
  const filename = getDefaulterExportFilename(monthLabel);

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('CSV export is only available in the browser.');
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    title: filename,
    message: csv,
  });
}
