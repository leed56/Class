export type AttendanceStatus = 'present' | 'late' | 'absent' | 'unmarked';

export type AttendanceStudent = {
  id: string;
  name: string;
  grade: number;
  medium: string;
  parentPhone: string;
  consentCaptured: boolean;
  feeStatus: 'paid' | 'partial' | 'pending' | 'overdue';
  attendanceStatus: AttendanceStatus;
  lastSeen?: string;
};

export type AttendanceSession = {
  id: string;
  subject: string;
  grade: number;
  medium: string;
  hall: string;
  date: string;
  startTime: string;
  endTime: string;
  totalStudents: number;
};
