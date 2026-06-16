import { Platform, Share } from 'react-native';

import { ClassPerformanceRow, ReportSummary } from '@/features/reports/reportsService';

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

export function buildMonthlyReportCsv(summary: ReportSummary, classRows: ClassPerformanceRow[]) {
  const lines = [
    csvRow(['ClassFlow Monthly Report']),
    csvRow(['Month', summary.monthLabel]),
    csvRow(['Generated', new Date().toLocaleString('en-LK')]),
    '',
    csvRow(['Summary Metric', 'Value']),
    csvRow(['Collection rate', `${summary.collectionPercent}%`]),
    csvRow(['Collected', summary.collected]),
    csvRow(['Outstanding', summary.outstanding]),
    csvRow(['Defaulters', summary.defaulterCount]),
    csvRow(['Average student attendance', `${summary.averageStudentAttendance}%`]),
    csvRow(['Total students', summary.totalStudents]),
    csvRow(['Total classes', summary.totalClasses]),
    csvRow(['Consent pending', summary.consentMissingCount]),
    '',
    csvRow(['Class', 'Enrolled', 'Attendance %', 'Collection %']),
    ...classRows.map((row) =>
      csvRow([row.label, row.enrolledCount, row.attendancePercent, row.collectionPercent]),
    ),
  ];

  return lines.join('\n');
}

export function getMonthlyReportFilename(monthLabel: string) {
  const slug = monthLabel.toLowerCase().replace(/\s+/g, '-');
  return `classflow-report-${slug}.csv`;
}

export async function exportMonthlyReportCsv(summary: ReportSummary, classRows: ClassPerformanceRow[]) {
  const csv = buildMonthlyReportCsv(summary, classRows);
  const filename = getMonthlyReportFilename(summary.monthLabel);

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
