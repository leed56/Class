import { listClasses } from '@/features/classes/classService';
import { getFeeSummaryForMonth } from '@/features/fees/feeService';
import { listStudents } from '@/features/students/studentService';

export type ReportSummary = {
  monthLabel: string;
  collectionPercent: number;
  collected: number;
  outstanding: number;
  defaulterCount: number;
  averageStudentAttendance: number;
  totalStudents: number;
  totalClasses: number;
  consentMissingCount: number;
};

export type ClassPerformanceRow = {
  id: string;
  label: string;
  attendancePercent: number;
  collectionPercent: number;
  enrolledCount: number;
};

export async function getReportSummary(): Promise<ReportSummary> {
  const [feeSummary, students, classes] = await Promise.all([
    getFeeSummaryForMonth(),
    listStudents(),
    listClasses(),
  ]);

  const averageStudentAttendance = students.length
    ? Math.round(students.reduce((sum, student) => sum + student.attendancePercent, 0) / students.length)
    : 0;

  return {
    monthLabel: feeSummary.monthLabel,
    collectionPercent: feeSummary.collectionPercent,
    collected: feeSummary.collected,
    outstanding: feeSummary.outstanding,
    defaulterCount: feeSummary.defaulterCount,
    averageStudentAttendance,
    totalStudents: students.length,
    totalClasses: classes.length,
    consentMissingCount: students.filter((student) => !student.consentCaptured).length,
  };
}

export async function getClassPerformanceRows(): Promise<ClassPerformanceRow[]> {
  const classes = await listClasses();
  return classes
    .map((item) => ({
      id: item.id,
      label: `${item.subject} G${item.grade}`,
      attendancePercent: item.attendanceAverage,
      collectionPercent: item.collectionPercent,
      enrolledCount: item.enrolledCount,
    }))
    .sort((a, b) => a.collectionPercent - b.collectionPercent);
}

export async function getWorkspaceHealth() {
  const summary = await getReportSummary();
  const dataHealth = summary.totalStudents
    ? Math.round(((summary.totalStudents - summary.consentMissingCount) / summary.totalStudents) * 100)
    : 100;

  return {
    dataHealth,
    consentMissingCount: summary.consentMissingCount,
    totalStudents: summary.totalStudents,
    totalClasses: summary.totalClasses,
  };
}
