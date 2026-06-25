import { Platform, Share } from 'react-native';

import { throwServiceError } from '@/i18n/serviceErrors';

import { BranchMonthlyReport } from './models';

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

export function buildBranchReportCsv(monthLabel: string, rows: BranchMonthlyReport[]) {
  const lines = [
    csvRow(['ClassFlow Branch Report']),
    csvRow(['Month', monthLabel]),
    csvRow(['Generated', new Date().toLocaleString('en-LK')]),
    '',
    csvRow(['Branch', 'Hall', 'Classes', 'Collected', 'Outstanding', 'Collection %', 'Attendance %']),
  ];

  for (const branch of rows) {
    if (branch.halls.length === 0) {
      lines.push(
        csvRow([
          branch.branchName,
          '',
          branch.classCount,
          branch.collected,
          branch.outstanding,
          branch.collectionPercent,
          branch.attendancePercent,
        ]),
      );
      continue;
    }

    for (const hall of branch.halls) {
      lines.push(
        csvRow([
          branch.branchName,
          hall.hallName,
          hall.classCount,
          hall.collected,
          hall.outstanding,
          hall.collectionPercent,
          hall.attendancePercent,
        ]),
      );
    }
  }

  return lines.join('\n');
}

export function getBranchReportFilename(monthLabel: string) {
  const slug = monthLabel.toLowerCase().replace(/\s+/g, '-');
  return `classflow-branch-report-${slug}.csv`;
}

export async function exportBranchReportCsv(monthLabel: string, rows: BranchMonthlyReport[]) {
  const csv = buildBranchReportCsv(monthLabel, rows);
  const filename = getBranchReportFilename(monthLabel);

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throwServiceError('csvExportWebOnly');
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

  await Share.share({ message: csv, title: filename });
}
