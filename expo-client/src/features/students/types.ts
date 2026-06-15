export type StudentMedium = 'English' | 'Sinhala' | 'Tamil';
export type StudentFeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type AttendanceTrend = 'excellent' | 'watch' | 'risk';

export type Student = {
  id: string;
  name: string;
  grade: number;
  medium: StudentMedium;
  school: string;
  parentName: string;
  parentPhone: string;
  className: string;
  feeStatus: StudentFeeStatus;
  monthlyFee: number;
  outstandingAmount: number;
  attendancePercent: number;
  attendanceTrend: AttendanceTrend;
  consentCaptured: boolean;
  lastPaymentDate?: string;
};
